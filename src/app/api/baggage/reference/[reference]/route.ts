import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Valid enum values for constrained fields
const VALID_TRANSPORT_MODES = ['flight', 'train', 'boat', 'bus'];
const VALID_BAGGAGE_TYPES = ['cabine', 'soute'];
const VALID_STATUSES = [
  'pending_activation',
  'active',
  'scanned',
  'lost',
  'found',
  'blocked',
];

// Helper: build update data from request body for baggage fields
function buildUpdateData(body: Record<string, unknown>): Record<string, unknown> {
  const updateData: Record<string, unknown> = {};

  // --- Core fields ---
  if (body.travelerFirstName !== undefined) {
    updateData.travelerFirstName = typeof body.travelerFirstName === 'string' && body.travelerFirstName.trim() !== ''
      ? body.travelerFirstName.trim()
      : null;
  }
  if (body.travelerLastName !== undefined) {
    updateData.travelerLastName = typeof body.travelerLastName === 'string' && body.travelerLastName.trim() !== ''
      ? body.travelerLastName.trim()
      : null;
  }
  if (body.whatsappOwner !== undefined) {
    updateData.whatsappOwner = typeof body.whatsappOwner === 'string' && body.whatsappOwner.trim() !== ''
      ? body.whatsappOwner.trim()
      : null;
  }
  if (body.status !== undefined) {
    if (typeof body.status !== 'string' || !VALID_STATUSES.includes(body.status)) {
      throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }
    updateData.status = body.status;
  }

  // --- Transport mode ---
  if (body.transportMode !== undefined) {
    if (typeof body.transportMode !== 'string' || !VALID_TRANSPORT_MODES.includes(body.transportMode)) {
      throw new Error(`Invalid transportMode. Must be one of: ${VALID_TRANSPORT_MODES.join(', ')}`);
    }
    updateData.transportMode = body.transportMode;
  }

  // --- Flight-specific fields ---
  if (body.airlineName !== undefined) {
    updateData.airlineName = typeof body.airlineName === 'string' && body.airlineName.trim() !== ''
      ? body.airlineName.trim()
      : null;
  }
  if (body.flightNumber !== undefined) {
    updateData.flightNumber = typeof body.flightNumber === 'string' && body.flightNumber.trim() !== ''
      ? body.flightNumber.trim()
      : null;
  }

  // --- Train-specific fields ---
  if (body.trainCompany !== undefined) {
    updateData.trainCompany = typeof body.trainCompany === 'string' && body.trainCompany.trim() !== ''
      ? body.trainCompany.trim()
      : null;
  }
  if (body.trainNumber !== undefined) {
    updateData.trainNumber = typeof body.trainNumber === 'string' && body.trainNumber.trim() !== ''
      ? body.trainNumber.trim()
      : null;
  }

  // --- Boat-specific fields ---
  if (body.shipName !== undefined) {
    updateData.shipName = typeof body.shipName === 'string' && body.shipName.trim() !== ''
      ? body.shipName.trim()
      : null;
  }
  if (body.shipCabin !== undefined) {
    updateData.shipCabin = typeof body.shipCabin === 'string' && body.shipCabin.trim() !== ''
      ? body.shipCabin.trim()
      : null;
  }

  // --- Bus-specific fields ---
  if (body.busCompany !== undefined) {
    updateData.busCompany = typeof body.busCompany === 'string' && body.busCompany.trim() !== ''
      ? body.busCompany.trim()
      : null;
  }
  if (body.busLineNumber !== undefined) {
    updateData.busLineNumber = typeof body.busLineNumber === 'string' && body.busLineNumber.trim() !== ''
      ? body.busLineNumber.trim()
      : null;
  }

  // --- Universal fields ---
  if (body.destination !== undefined) {
    updateData.destination = typeof body.destination === 'string' && body.destination.trim() !== ''
      ? body.destination.trim()
      : null;
  }
  if (body.departureDate !== undefined) {
    // Accept ISO date string or null
    if (body.departureDate === null || body.departureDate === '') {
      updateData.departureDate = null;
    } else {
      const parsed = new Date(body.departureDate as string);
      if (isNaN(parsed.getTime())) {
        throw new Error('Invalid departureDate. Must be a valid ISO date string.');
      }
      updateData.departureDate = parsed;
    }
  }
  if (body.departureTime !== undefined) {
    updateData.departureTime = typeof body.departureTime === 'string' && body.departureTime.trim() !== ''
      ? body.departureTime.trim()
      : null;
  }

  // --- Baggage type ---
  if (body.baggageType !== undefined) {
    if (typeof body.baggageType !== 'string' || !VALID_BAGGAGE_TYPES.includes(body.baggageType)) {
      throw new Error(`Invalid baggageType. Must be one of: ${VALID_BAGGAGE_TYPES.join(', ')}`);
    }
    updateData.baggageType = body.baggageType;
  }

  return updateData;
}

// Helper: shape the baggage response object
function shapeBaggageResponse(baggage: Record<string, unknown>) {
  return {
    id: baggage.id,
    reference: baggage.reference,
    type: baggage.type,
    travelerFirstName: baggage.travelerFirstName,
    travelerLastName: baggage.travelerLastName,
    whatsappOwner: baggage.whatsappOwner,
    baggageIndex: baggage.baggageIndex,
    baggageType: baggage.baggageType,
    status: baggage.status,
    transportMode: baggage.transportMode,
    airlineName: baggage.airlineName,
    flightNumber: baggage.flightNumber,
    trainCompany: baggage.trainCompany,
    trainNumber: baggage.trainNumber,
    shipName: baggage.shipName,
    shipCabin: baggage.shipCabin,
    busCompany: baggage.busCompany,
    busLineNumber: baggage.busLineNumber,
    destination: baggage.destination,
    departureDate: baggage.departureDate,
    departureTime: baggage.departureTime,
    agencyId: baggage.agencyId,
    createdAt: baggage.createdAt,
    expiresAt: baggage.expiresAt,
    lastScanDate: baggage.lastScanDate,
    lastLocation: baggage.lastLocation,
    declaredLostAt: baggage.declaredLostAt,
    foundAt: baggage.foundAt,
  };
}

// PUT - Update a baggage by reference
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const body = await request.json();

    // Check if baggage exists by reference
    const existingBaggage = await db.baggage.findUnique({
      where: { reference },
    });

    if (!existingBaggage) {
      return NextResponse.json(
        { error: 'Baggage not found' },
        { status: 404 }
      );
    }

    // Build update data with validation
    let updateData: Record<string, unknown>;
    try {
      updateData = buildUpdateData(body);
    } catch (validationError) {
      const message = validationError instanceof Error ? validationError.message : 'Validation error';
      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }

    // If no fields to update, return current baggage
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: true,
        baggage: shapeBaggageResponse(existingBaggage),
      });
    }

    // Update the baggage
    const updatedBaggage = await db.baggage.update({
      where: { reference },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      baggage: shapeBaggageResponse(updatedBaggage),
    });

  } catch (error) {
    console.error('Update baggage by reference error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get a single baggage by reference
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;

    const baggage = await db.baggage.findUnique({
      where: { reference },
      include: { agency: true },
    });

    if (!baggage) {
      return NextResponse.json(
        { error: 'Baggage not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: baggage.id,
      reference: baggage.reference,
      type: baggage.type,
      travelerFirstName: baggage.travelerFirstName,
      travelerLastName: baggage.travelerLastName,
      whatsappOwner: baggage.whatsappOwner,
      baggageIndex: baggage.baggageIndex,
      baggageType: baggage.baggageType,
      status: baggage.status,
      transportMode: baggage.transportMode,
      airlineName: baggage.airlineName,
      flightNumber: baggage.flightNumber,
      trainCompany: baggage.trainCompany,
      trainNumber: baggage.trainNumber,
      shipName: baggage.shipName,
      shipCabin: baggage.shipCabin,
      busCompany: baggage.busCompany,
      busLineNumber: baggage.busLineNumber,
      destination: baggage.destination,
      departureDate: baggage.departureDate,
      departureTime: baggage.departureTime,
      agencyId: baggage.agencyId,
      agency: baggage.agency ? {
        id: baggage.agency.id,
        name: baggage.agency.name,
        email: baggage.agency.email,
        phone: baggage.agency.phone,
      } : null,
      createdAt: baggage.createdAt,
      expiresAt: baggage.expiresAt,
      lastScanDate: baggage.lastScanDate,
      lastLocation: baggage.lastLocation,
      declaredLostAt: baggage.declaredLostAt,
      foundAt: baggage.foundAt,
    });

  } catch (error) {
    console.error('Get baggage by reference error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
