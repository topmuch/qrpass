// ═══════════════════════════════════════════════════════════════
//  Agency Controller — Full business logic for Agency CRUD
// ═══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { prisma } from '../lib';
import { createAgencySchema, updateAgencySchema } from '../utils/validators';

// ─── List Agencies (with pagination + counts) ───

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const rawLimit = Number(req.query.limit) || 20;
    const limit = Math.min(Math.max(1, rawLimit), 100); // clamp 1–100
    const skip = (page - 1) * limit;

    // Optional active filter
    const activeFilter = req.query.active === 'true'
      ? { active: true }
      : req.query.active === 'false'
        ? { active: false }
        : {};

    const [agencies, total] = await Promise.all([
      prisma.agency.findMany({
        where: activeFilter,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              trips: true,
              pilgrims: true,
            },
          },
        },
      }),
      prisma.agency.count({ where: activeFilter }),
    ]);

    res.json({
      data: agencies.map((a) => ({
        ...a,
        tripsCount: a._count.trips,
        pilgrimsCount: a._count.pilgrims,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[AgencyController] list error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ─── Get Agency by ID ───

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const agency = await prisma.agency.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            trips: true,
            pilgrims: true,
            users: true,
            bags: true,
          },
        },
      },
    });

    if (!agency) {
      res.status(404).json({ error: 'Agence non trouvée.' });
      return;
    }

    res.json({
      ...agency,
      tripsCount: agency._count.trips,
      pilgrimsCount: agency._count.pilgrims,
      usersCount: agency._count.users,
      bagsCount: agency._count.bags,
      _count: undefined,
    });
  } catch (error) {
    console.error('[AgencyController] getById error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ─── Get Agency by Slug (public pages) ───

export async function getBySlug(req: Request, res: Response): Promise<void> {
  try {
    const { slug } = req.params;

    const agency = await prisma.agency.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            trips: true,
            pilgrims: true,
          },
        },
      },
    });

    if (!agency) {
      res.status(404).json({ error: 'Agence non trouvée.' });
      return;
    }

    if (!agency.active) {
      res.status(404).json({ error: 'Agence inactive.' });
      return;
    }

    res.json({
      ...agency,
      tripsCount: agency._count.trips,
      pilgrimsCount: agency._count.pilgrims,
      _count: undefined,
    });
  } catch (error) {
    console.error('[AgencyController] getBySlug error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ─── Create Agency ───

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const result = createAgencySchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Données invalides.',
        details: result.error.issues,
      });
      return;
    }

    const data = result.data;

    // Check slug uniqueness
    const existing = await prisma.agency.findUnique({ where: { slug: data.slug } });
    if (existing) {
      res.status(409).json({
        error: 'Un slug doit être unique. Cette agence existe déjà.',
        field: 'slug',
      });
      return;
    }

    const agency = await prisma.agency.create({
      data: {
        name: data.name,
        slug: data.slug,
        email: data.email,
        phone: data.phone,
        whatsapp: data.whatsapp,
        address: data.address,
        country: data.country,
        plan: data.plan,
        maxPilgrims: data.maxPilgrims,
      },
    });

    res.status(201).json(agency);
  } catch (error) {
    console.error('[AgencyController] create error:', error);

    // Handle Prisma unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      res.status(409).json({ error: 'Conflit : cette agence existe déjà.' });
      return;
    }

    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ─── Update Agency ───

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Verify agency exists
    const existing = await prisma.agency.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Agence non trouvée.' });
      return;
    }

    const result = updateAgencySchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Données invalides.',
        details: result.error.issues,
      });
      return;
    }

    const data = result.data;

    // If slug is being updated, check uniqueness
    if (data.slug && data.slug !== existing.slug) {
      const slugConflict = await prisma.agency.findUnique({ where: { slug: data.slug } });
      if (slugConflict) {
        res.status(409).json({
          error: 'Un slug doit être unique. Ce slug est déjà utilisé.',
          field: 'slug',
        });
        return;
      }
    }

    const agency = await prisma.agency.update({
      where: { id },
      data,
    });

    res.json(agency);
  } catch (error) {
    console.error('[AgencyController] update error:', error);

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      res.status(409).json({ error: 'Conflit : cette ressource existe déjà.' });
      return;
    }

    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}

// ─── Soft-Delete Agency (set active=false) ───

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Verify agency exists
    const existing = await prisma.agency.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Agence non trouvée.' });
      return;
    }

    if (!existing.active) {
      res.status(400).json({ error: 'Agence déjà désactivée.' });
      return;
    }

    const agency = await prisma.agency.update({
      where: { id },
      data: { active: false },
    });

    res.json({
      message: 'Agence désactivée avec succès.',
      agency,
    });
  } catch (error) {
    console.error('[AgencyController] remove error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}
