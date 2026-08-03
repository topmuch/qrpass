'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Info } from 'lucide-react';

// ─── Brand constants ───
const BG = '#f4b400';
const CARD_BG = '#ffffff';
const TEXT = '#1a1a1a';
const MUTED = '#6b7280';
const SUCCESS = '#10b981';
const BTN_PRIMARY = '#111827';
const BTN_PRIMARY_HOVER = '#374151';
const WHATSAPP = '#25D366';
const WHATSAPP_HOVER = '#128C7E';

interface ConfirmationData {
  type: 'baggage' | 'identity';
  code: string;
  firstName: string;
  lastName: string;
  // Baggage-specific
  flight: string;
  destination: string;
  chefPhone: string;
  // Identity-specific
  bloodType: string;
  hotel: string;
  room: string;
  leaderPhone: string;
  // Shared
  photo: string | null;
}

// ─── Confetti Component ───
function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#f4b400', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b'];
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      rotation: number;
      rotationSpeed: number;
      opacity: number;
    }> = [];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
      });
    }

    let animationId: number;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > 4000) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.rotation += p.rotationSpeed;
        p.opacity = Math.max(0, 1 - elapsed / 4000);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}

// ─── Main Content ───
function ConfirmationContent() {
  const searchParams = useSearchParams();

  // Compute data from URL params
  const type = (searchParams.get('type') || 'baggage') as 'baggage' | 'identity';
  const code = searchParams.get('code') || '';
  const firstName = searchParams.get('firstName') || '';
  const lastName = searchParams.get('lastName') || '';
  const flight = searchParams.get('flight') || '';
  const destination = searchParams.get('destination') || '';
  const chefPhone = searchParams.get('chefPhone') || '';
  const bloodType = searchParams.get('bloodType') || '';
  const hotel = searchParams.get('hotel') || '';
  const room = searchParams.get('room') || '';
  const leaderPhone = searchParams.get('leaderPhone') || '';
  const photo = searchParams.get('photo') || null;

  // Fallback: try sessionStorage if no code from URL
  let data: ConfirmationData | null = null;
  if (code) {
    data = {
      type,
      code,
      firstName,
      lastName,
      flight,
      destination,
      chefPhone,
      bloodType,
      hotel,
      room,
      leaderPhone,
      photo,
    };
  } else if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('activationData');
      if (stored) {
        const parsed = JSON.parse(stored);
        data = {
          type: parsed.type || 'baggage',
          code: parsed.reference || '',
          firstName: parsed.firstName || '',
          lastName: parsed.lastName || '',
          flight: parsed.flightNumber || parsed.airlineName || '',
          destination: parsed.destination || '',
          chefPhone: parsed.whatsapp || parsed.chefPhone || '',
          bloodType: parsed.bloodType || '',
          hotel: parsed.hotel || '',
          room: parsed.room || '',
          leaderPhone: parsed.leaderPhone || '',
          photo: parsed.photoUrl || null,
        };
      }
    } catch {
      // Silent — sessionStorage may be unavailable
    }
  }

  const isIdentity = data?.type === 'identity';
  const productLabel = isIdentity ? 'Bracelet Identity' : 'Bagage';
  const subtitle = isIdentity
    ? 'Votre bracelet est maintenant activé'
    : 'Votre bagage est maintenant protégé';

  // WhatsApp share message
  const whatsappMessage = data
    ? encodeURIComponent(
        isIdentity
          ? `✅ J'ai activé mon PassHajj Identity !\n\n` +
            `Code: ${data.code}\n` +
            `Pèlerin: ${data.firstName} ${data.lastName}\n` +
            `Groupe sanguin: ${data.bloodType || 'Non renseigné'}\n\n` +
            `Protégez vos proches aussi : passhajj.com`
          : `✅ J'ai activé mon PassHajj Bagage !\n\n` +
            `Code: ${data.code}\n` +
            `Propriétaire: ${data.firstName} ${data.lastName}\n` +
            `Vol: ${data.flight} - ${data.destination}\n\n` +
            `Protégez vos bagages aussi : passhajj.com`
      )
    : '';

  const whatsappHref = `https://wa.me/?text=${whatsappMessage}`;

  if (!data || !data.code) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4" style={{ background: BG }}>
        <div className="bg-white rounded-[20px] p-8 text-center max-w-[420px] w-full shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Données introuvables</h1>
          <p className="text-gray-500 text-sm mb-6">
            Les informations d&apos;activation n&apos;ont pas été trouvées. Veuillez réessayer.
          </p>
          <Link
            href="/select"
            className="inline-block w-full py-4 rounded-[14px] text-white font-bold text-base text-center"
            style={{ background: BTN_PRIMARY }}
          >
            Retour à la sélection
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: BG, color: TEXT }}>
      <Confetti />

      {/* Logo */}
      <div className="text-2xl font-extrabold tracking-tight text-black mb-4">
        <span className="text-white bg-black px-2 py-0.5 rounded-md mr-1">Pass</span>Hajj
      </div>

      {/* Card */}
      <div
        className="bg-white w-full max-w-[420px] rounded-[20px] p-8 shadow-lg text-center"
        style={{ animation: 'slideUp 0.4s ease' }}
      >
        {/* Success Icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: SUCCESS, animation: 'scaleIn 0.5s ease 0.2s both' }}
        >
          <CheckCircle className="w-10 h-10 text-white" strokeWidth={3} />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-extrabold mb-2">Activation Confirmée ! ✅</h1>
        <p className="text-sm mb-6" style={{ color: MUTED }}>
          {subtitle}
        </p>

        {/* Summary Box */}
        <div className="bg-gray-50 rounded-2xl p-5 text-left mb-6">
          <div className="flex justify-between py-2.5 border-b border-gray-200">
            <span className="text-sm" style={{ color: MUTED }}>Code QR</span>
            <span className="font-mono bg-black text-white px-3 py-0.5 rounded-md text-xs tracking-wider font-bold">
              {data.code}
            </span>
          </div>
          <div className="flex justify-between py-2.5 border-b border-gray-200">
            <span className="text-sm" style={{ color: MUTED }}>
              {isIdentity ? 'Pèlerin' : 'Propriétaire'}
            </span>
            <span className="font-bold text-sm">
              {data.firstName} {data.lastName}
            </span>
          </div>

          {/* Baggage-specific fields */}
          {!isIdentity && data.flight && (
            <div className="flex justify-between py-2.5 border-b border-gray-200">
              <span className="text-sm" style={{ color: MUTED }}>Vol</span>
              <span className="font-bold text-sm">
                {data.flight} {data.destination ? `– ${data.destination}` : ''}
              </span>
            </div>
          )}
          {!isIdentity && data.chefPhone && (
            <div className="flex justify-between py-2.5">
              <span className="text-sm" style={{ color: MUTED }}>Contact Chef</span>
              <span className="font-bold text-sm">{data.chefPhone}</span>
            </div>
          )}

          {/* Identity-specific fields */}
          {isIdentity && data.bloodType && (
            <div className="flex justify-between py-2.5 border-b border-gray-200">
              <span className="text-sm" style={{ color: MUTED }}>Groupe Sanguin</span>
              <span className="font-bold text-sm">{data.bloodType}</span>
            </div>
          )}
          {isIdentity && data.hotel && (
            <div className="flex justify-between py-2.5 border-b border-gray-200">
              <span className="text-sm" style={{ color: MUTED }}>Hôtel</span>
              <span className="font-bold text-sm">{data.hotel} {data.room ? `— Ch. ${data.room}` : ''}</span>
            </div>
          )}
          {isIdentity && data.leaderPhone && (
            <div className="flex justify-between py-2.5">
              <span className="text-sm" style={{ color: MUTED }}>Chef de Groupe</span>
              <span className="font-bold text-sm">{data.leaderPhone}</span>
            </div>
          )}
        </div>

        {/* Photo Section */}
        {data.photo && (
          <div className="mb-6 p-4 bg-gray-100 rounded-xl">
            <span className="text-xs block mb-2" style={{ color: MUTED }}>
              {isIdentity ? '📸 Photo du Pèlerin' : '📸 Photo du bagage'}
            </span>
            <img
              src={data.photo}
              alt={isIdentity ? 'Pèlerin' : 'Bagage'}
              className={`max-w-full max-h-36 object-cover mx-auto ${
                isIdentity ? 'rounded-full w-32 h-32' : 'rounded-lg'
              }`}
            />
          </div>
        )}

        {/* Tips */}
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg mb-6 text-left">
          <div className="flex items-center gap-2 font-bold mb-2">
            <Info className="w-5 h-5 text-amber-600" />
            Conseils importants
          </div>
          {isIdentity ? (
            <ul className="ml-5 text-sm list-disc space-y-1.5" style={{ color: MUTED }}>
              <li>Portez le bracelet en permanence pendant le pèlerinage</li>
              <li>Conservez ce code de référence : <strong className="text-black">{data.code}</strong></li>
              <li>En cas de malaise, les secours scanneront le bracelet</li>
              <li>Le chef de groupe recevra une alerte WhatsApp immédiate</li>
            </ul>
          ) : (
            <ul className="ml-5 text-sm list-disc space-y-1.5" style={{ color: MUTED }}>
              <li>Collez l&apos;étiquette QR sur votre valise de façon visible</li>
              <li>Conservez ce code de référence : <strong className="text-black">{data.code}</strong></li>
              <li>Si votre bagage est perdu, le trouveur scannera le QR</li>
              <li>Le chef de groupe recevra une alerte WhatsApp immédiate</li>
            </ul>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href={isIdentity ? `/p/${data.code}` : `/suivi/${data.code}`}
            className="w-full py-4 rounded-[14px] text-white font-bold text-base flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
            style={{ background: BTN_PRIMARY }}
          >
            {isIdentity ? '👤 Voir mon profil' : '📊 Voir mon tableau de bord'}
          </Link>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 rounded-[14px] text-white font-bold text-base flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
            style={{ background: WHATSAPP }}
          >
            💬 Partager sur WhatsApp
          </a>
          <Link
            href="/select"
            className="w-full py-4 rounded-[14px] font-bold text-base flex items-center justify-center gap-2 border-2 border-black bg-white text-black hover:bg-gray-50 transition-colors"
          >
            ➕ Activer un autre produit
          </Link>
          <Link
            href="/"
            className="w-full py-4 rounded-[14px] font-bold text-base flex items-center justify-center gap-2 border-2 border-black bg-white text-black hover:bg-gray-50 transition-colors"
          >
            🏠 Retour à l&apos;accueil
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-xs text-center" style={{ color: 'rgba(0,0,0,0.6)' }}>
        Propulsé par <strong>PassHajj</strong> ·{' '}
        <Link href="/contact" className="text-black font-semibold underline">Besoin d&apos;aide ?</Link>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
      `}</style>
    </main>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-black/20 border-t-black rounded-full mx-auto mb-4" />
          <p className="text-black font-medium">Chargement...</p>
        </div>
      </main>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
