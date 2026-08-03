'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/useTranslation';
import type { Language } from '@/lib/i18n';

type ProblemType = 'bagages' | 'personnes' | 'urgences';

interface ProblemDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ProblemType;
  lang?: Language;
}

const BRAND = '#f4b400';
const NAVY = '#0c1d3a';
const DANGER = '#ef4444';
const SUCCESS = '#10b981';

export default function ProblemDetailDialog({ open, onOpenChange, type, lang: langProp }: ProblemDetailDialogProps) {
  const { t, lang: langHook, dir } = useTranslation();
  const lang = langProp || langHook;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to top when dialog opens
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [open]);

  const isRtl = dir === 'rtl';

  const contentMap: Record<ProblemType, { icon: string; color: string; product: 'bagage' | 'identity'; ctaLink: string }> = {
    bagages: { icon: '🧳', color: DANGER, product: 'bagage', ctaLink: '/activate/baggage' },
    personnes: { icon: '👴', color: '#f59e0b', product: 'identity', ctaLink: '/activate/identity' },
    urgences: { icon: '🏥', color: DANGER, product: 'identity', ctaLink: '/activate/identity' },
  };

  const config = contentMap[type];
  const prefix = `landing.problemDetail.${type}`;

  // Render stat cards
  const renderStats = () => {
    const statCount = type === 'bagages' ? 4 : type === 'personnes' ? 3 : 4;
    const stats = [];
    for (let i = 1; i <= statCount; i++) {
      const value = t(`${prefix}.stat${i}Value`);
      const label = t(`${prefix}.stat${i}Label`);
      if (value === `${prefix}.stat${i}Value`) continue; // translation missing
      stats.push({ value, label });
    }
    if (stats.length === 0) return null;
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: stats.length <= 3 ? `repeat(${stats.length}, 1fr)` : 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '28px',
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: `${NAVY}06`,
            border: `1px solid ${NAVY}12`,
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '24px', fontWeight: 900, color: config.color, lineHeight: 1.2 }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', lineHeight: 1.4 }}>{s.label}</div>
          </div>
        ))}
      </div>
    );
  };

  // Render scenario cards
  const renderScenarios = () => {
    const scenarios = [];
    for (let i = 1; i <= 3; i++) {
      const title = t(`${prefix}.scenario${i}Title`);
      const desc = t(`${prefix}.scenario${i}Desc`);
      const icon = t(`${prefix}.scenario${i}Icon`);
      if (title === `${prefix}.scenario${i}Title`) continue;
      scenarios.push({ title, desc, icon });
    }
    if (scenarios.length === 0) return null;
    return (
      <div style={{ marginBottom: '28px' }}>
        <h3 style={{
          fontSize: '16px', fontWeight: 800, color: NAVY,
          marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          ⚠️ {t(`${prefix}.scenariosTitle`)}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {scenarios.map((s, i) => (
            <div key={i} style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex', gap: '12px', alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: '22px', lineHeight: 1, flexShrink: 0 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: NAVY, marginBottom: '3px' }}>{s.title}</div>
                <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render solution section
  const renderSolution = () => {
    const solutionTitle = t(`${prefix}.solutionTitle`);
    const solutionDesc = t(`${prefix}.solutionDesc`);
    if (solutionTitle === `${prefix}.solutionTitle`) return null;

    const features = [];
    for (let i = 1; i <= 5; i++) {
      const feat = t(`${prefix}.solutionFeat${i}`);
      if (feat === `${prefix}.solutionFeat${i}`) continue;
      features.push(feat);
    }

    return (
      <div style={{
        marginBottom: '28px',
        background: `linear-gradient(135deg, ${NAVY}08, ${BRAND}08)`,
        border: `1px solid ${BRAND}30`,
        borderRadius: '16px',
        padding: '20px',
      }}>
        <h3 style={{
          fontSize: '16px', fontWeight: 800, color: NAVY,
          marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          🛡️ {solutionTitle}
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.7, marginBottom: '14px' }}>
          {solutionDesc}
        </p>
        {features.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {features.map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '13px', color: NAVY, fontWeight: 600,
              }}>
                <span style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: `${SUCCESS}15`, color: SUCCESS,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 800, flexShrink: 0,
                }}>✓</span>
                {f}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render steps
  const renderSteps = () => {
    const stepsTitle = t(`${prefix}.stepsTitle`);
    if (stepsTitle === `${prefix}.stepsTitle`) return null;

    const steps = [];
    for (let i = 1; i <= 4; i++) {
      const step = t(`${prefix}.step${i}`);
      if (step === `${prefix}.step${i}`) continue;
      steps.push(step);
    }

    return (
      <div style={{ marginBottom: '28px' }}>
        <h3 style={{
          fontSize: '16px', fontWeight: 800, color: NAVY,
          marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          📋 {stepsTitle}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {steps.map((s, i) => (
            <div key={i} style={{
              display: 'flex', gap: '12px', alignItems: 'flex-start',
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: BRAND, color: NAVY,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 900, flexShrink: 0,
                boxShadow: `0 2px 8px ${BRAND}40`,
              }}>{i + 1}</div>
              <div style={{
                paddingTop: '5px',
                fontSize: '14px', color: '#334155', lineHeight: 1.6, fontWeight: 500,
              }}>{s}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render example
  const renderExample = () => {
    const exampleTitle = t(`${prefix}.exampleTitle`);
    const exampleDesc = t(`${prefix}.exampleDesc`);
    if (exampleTitle === `${prefix}.exampleTitle`) return null;
    return (
      <div style={{
        marginBottom: '24px',
        background: `${BRAND}10`,
        borderLeft: isRtl ? 'none' : `4px solid ${BRAND}`,
        borderRight: isRtl ? `4px solid ${BRAND}` : 'none',
        borderRadius: '0 12px 12px 0',
        padding: '16px 18px',
      }}>
        <div style={{ fontSize: '13px', fontWeight: 800, color: NAVY, marginBottom: '6px' }}>
          💡 {exampleTitle}
        </div>
        <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.7 }}>
          {exampleDesc}
        </div>
      </div>
    );
  };

  const ctaText = t(`${prefix}.cta`);
  const ctaSubtext = t(`${prefix}.ctaSubtext`);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="max-w-2xl w-[calc(100%-2rem)] max-h-[90vh] p-0 overflow-hidden"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{t(`${prefix}.title`)}</DialogTitle>
          <DialogDescription>{t(`${prefix}.intro`)}</DialogDescription>
        </DialogHeader>

        <div ref={scrollRef} style={{
          maxHeight: '85vh',
          overflowY: 'auto',
          direction: dir,
        }} className="custom-scrollbar">
          {/* Hero Banner */}
          <div style={{
            background: `linear-gradient(135deg, ${NAVY}, ${NAVY}cc)`,
            padding: '28px 24px 24px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: '-30px', right: isRtl ? 'auto' : '-30px', left: isRtl ? '-30px' : 'auto',
              width: '120px', height: '120px', borderRadius: '50%',
              background: `${BRAND}15`,
            }} />
            <div style={{
              position: 'absolute', bottom: '-20px', right: isRtl ? 'auto' : '60px', left: isRtl ? '60px' : 'auto',
              width: '80px', height: '80px', borderRadius: '50%',
              background: `${BRAND}10`,
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <span style={{ fontSize: '44px', display: 'block', marginBottom: '10px' }}>{config.icon}</span>
              <h2 style={{
                fontSize: '22px', fontWeight: 900, color: '#fff',
                marginBottom: '8px', lineHeight: 1.3,
              }}>
                {t(`${prefix}.title`)}
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>
                {t(`${prefix}.intro`)}
              </p>
            </div>
          </div>

          {/* Body Content */}
          <div style={{ padding: '24px' }}>
            {/* Stats */}
            {renderStats()}

            {/* Scenarios */}
            {renderScenarios()}

            {/* Solution */}
            {renderSolution()}

            {/* Steps */}
            {renderSteps()}

            {/* Example */}
            {renderExample()}

            {/* CTA */}
            <div style={{
              background: `linear-gradient(135deg, ${NAVY}, ${NAVY}dd)`,
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: '16px', fontWeight: 800, color: '#fff',
                marginBottom: '6px',
              }}>
                {ctaText}
              </div>
              {ctaSubtext !== `${prefix}.ctaSubtext` && (
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>
                  {ctaSubtext}
                </div>
              )}
              <Link
                href={config.ctaLink}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: BRAND, color: NAVY,
                  padding: '12px 28px', borderRadius: '12px',
                  fontSize: '15px', fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: `0 4px 20px ${BRAND}50`,
                  transition: 'all 0.25s',
                }}
              >
                {config.product === 'bagage' ? '🧳' : '👤'}{' '}
                {config.product === 'bagage'
                  ? (lang === 'ar' ? 'تفعيل أمتعة' : lang === 'en' ? 'Activate Luggage' : 'Activer un Bagage')
                  : (lang === 'ar' ? 'تفعيل سوار' : lang === 'en' ? 'Activate Bracelet' : 'Activer un Bracelet')
                } →
              </Link>
            </div>
          </div>
        </div>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
