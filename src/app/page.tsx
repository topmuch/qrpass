'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import type { Language } from '@/lib/i18n';

export default function HomePage() {
  const { t, lang, setLang, dir } = useTranslation();
  const mainRef = useRef<HTMLDivElement>(null);

  const cycleLang = () => {
    const next: Record<Language, Language> = { fr: 'en', en: 'ar', ar: 'fr' };
    setLang(next[lang]);
  };

  /* Scroll-reveal animation */
  useEffect(() => {
    if (!mainRef.current) return;
    const els = mainRef.current.querySelectorAll<HTMLElement>(
      '.product-card, .testimonial-card, .step-card, .stat-card, .problem-card',
    );
    els.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div lang={lang} dir={dir} ref={mainRef}>
      <style>{`
        :root {
          --primary: #1e3a8a;
          --primary-light: #3b82f6;
          --accent: #fbbf24;
          --bg: #ffffff;
          --bg-alt: #f8fafc;
          --text: #0f172a;
          --muted: #64748b;
          --success: #10b981;
          --danger: #ef4444;
          --radius: 16px;
          --shadow: 0 4px 12px rgba(0,0,0,0.06);
          --shadow-lg: 0 8px 24px rgba(30, 58, 138, 0.12);
        }
        .ph2 * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        .ph2 { background: var(--bg); color: var(--text); line-height: 1.6; overflow-x: hidden; }
        html { scroll-behavior: smooth; }

        /* HEADER */
        .ph2-header {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: rgba(255,255,255,0.98); backdrop-filter: blur(10px);
          padding: 14px 20px; display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .ph2-logo { font-size: 22px; font-weight: 800; color: var(--primary); letter-spacing: -0.5px; }
        .ph2-logo span { color: var(--accent); }
        .ph2-nav { display: flex; gap: 12px; align-items: center; }
        .ph2-btn-ghost { background: transparent; border: 1.5px solid #e2e8f0; padding: 8px 14px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; color: var(--text); transition: 0.2s; text-decoration: none; }
        .ph2-btn-ghost:hover { border-color: var(--primary); color: var(--primary); }
        .ph2-btn-primary { background: var(--primary); color: #fff; border: none; padding: 8px 16px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: 0.2s; text-decoration: none; }
        .ph2-btn-primary:hover { background: var(--primary-light); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(30,58,138,0.3); }
        .ph2-lang-toggle { background: rgba(30,58,138,0.08); border: none; padding: 6px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; color: var(--primary); transition: 0.2s; }
        .ph2-lang-toggle:hover { background: rgba(30,58,138,0.15); }

        /* HERO */
        .ph2-hero {
          padding: 140px 20px 80px;
          background: linear-gradient(135deg, var(--primary) 0%, #1e40af 100%);
          color: #fff;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .ph2-hero::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          opacity: 0.3;
        }
        .ph2-hero-content { position: relative; z-index: 1; max-width: 800px; margin: 0 auto; }
        .ph2-hero h1 { font-size: clamp(32px, 5vw, 48px); font-weight: 800; line-height: 1.2; margin-bottom: 20px; letter-spacing: -0.5px; }
        .ph2-hero p { font-size: 18px; opacity: 0.95; max-width: 650px; margin: 0 auto 32px; line-height: 1.6; }
        .ph2-cta-group { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
        .ph2-btn-hero { padding: 16px 32px; border-radius: 14px; font-size: 16px; font-weight: 700; cursor: pointer; border: none; transition: 0.3s; text-decoration: none; display: inline-flex; align-items: center; gap: 10px; }
        .ph2-btn-hero-primary { background: var(--accent); color: #0f172a; }
        .ph2-btn-hero-primary:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(251,191,36,0.4); }
        .ph2-btn-hero-secondary { background: rgba(255,255,255,0.15); color: #fff; border: 2px solid rgba(255,255,255,0.3); backdrop-filter: blur(4px); }
        .ph2-btn-hero-secondary:hover { background: rgba(255,255,255,0.25); border-color: #fff; }

        /* STATS */
        .ph2-stats { background: var(--bg-alt); padding: 60px 20px; border-bottom: 1px solid #e2e8f0; }
        .ph2-stats-grid { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; }
        .stat-card { background: #fff; padding: 24px; border-radius: var(--radius); text-align: center; box-shadow: var(--shadow); border-top: 3px solid var(--accent); }
        .stat-number { font-size: 36px; font-weight: 800; color: var(--primary); display: block; margin-bottom: 8px; }
        .stat-label { font-size: 14px; color: var(--muted); font-weight: 500; }

        /* SECTIONS */
        .ph2-section { padding: 80px 20px; max-width: 1200px; margin: 0 auto; }
        .section-header { text-align: center; margin-bottom: 56px; }
        .section-tag { display: inline-block; background: rgba(30,58,138,0.1); color: var(--primary); padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
        .section-title { font-size: clamp(28px, 4vw, 36px); font-weight: 800; color: var(--text); margin-bottom: 16px; letter-spacing: -0.5px; }
        .section-subtitle { font-size: 16px; color: var(--muted); max-width: 650px; margin: 0 auto; line-height: 1.6; }

        /* PROBLEM */
        .ph2-problem { background: var(--bg-alt); padding: 80px 20px; }
        .ph2-problem-inner { max-width: 1200px; margin: 0 auto; }
        .problem-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
        .problem-card { background: #fff; padding: 28px; border-radius: var(--radius); box-shadow: var(--shadow); border-left: 4px solid var(--danger); }
        .problem-icon { font-size: 32px; margin-bottom: 16px; display: block; }
        .problem-card h3 { font-size: 18px; font-weight: 700; margin-bottom: 10px; color: var(--text); }
        .problem-card p { font-size: 14px; color: var(--muted); line-height: 1.6; }

        /* PRODUCTS */
        .product-showcase { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: start; }
        .product-card { background: #fff; border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-lg); border: 1px solid #e2e8f0; transition: 0.3s; }
        .product-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(30,58,138,0.15); }
        .product-header { background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%); color: #fff; padding: 28px; text-align: center; }
        .product-icon-large { font-size: 48px; margin-bottom: 12px; display: block; }
        .product-header h3 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
        .product-header p { opacity: 0.95; font-size: 14px; }
        .product-body { padding: 28px; }
        .product-description { font-size: 15px; color: var(--muted); margin-bottom: 24px; line-height: 1.6; }
        .how-it-works { margin-bottom: 24px; }
        .how-it-works h4 { font-size: 15px; font-weight: 700; margin-bottom: 12px; color: var(--text); }
        .ph2-step { display: flex; gap: 12px; margin-bottom: 12px; align-items: flex-start; }
        .step-num { width: 28px; height: 28px; background: var(--accent); color: #0f172a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0; }
        .step-text { font-size: 14px; color: var(--muted); padding-top: 4px; }
        .use-case { background: #f8fafc; padding: 16px; border-radius: 12px; border-left: 3px solid var(--accent); }
        .use-case h5 { font-size: 14px; font-weight: 700; margin-bottom: 6px; color: var(--text); }
        .use-case p { font-size: 13px; color: var(--muted); line-height: 1.5; }
        .product-footer { padding: 20px 28px; border-top: 1px solid #e2e8f0; }
        .btn-product { width: 100%; padding: 14px; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: 0.2s; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-product-primary { background: var(--primary); color: #fff; }
        .btn-product-primary:hover { background: var(--primary-light); }

        /* COMPARISON */
        .ph2-comparison { background: var(--bg-alt); padding: 80px 20px; }
        .ph2-comparison-inner { max-width: 1200px; margin: 0 auto; }
        .comparison-table { background: #fff; border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); }
        .comparison-row { display: grid; grid-template-columns: 1.5fr 1fr 1fr; padding: 18px 24px; border-bottom: 1px solid #e2e8f0; align-items: center; }
        .comparison-row.header { background: var(--primary); color: #fff; font-weight: 700; }
        .comparison-row:last-child { border-bottom: none; }
        .comparison-cell { font-size: 14px; }
        .comparison-cell.check { color: var(--success); font-weight: 700; }
        .comparison-cell.cross { color: var(--danger); }

        /* STEPS */
        .steps-container { display: flex; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
        .step-card { flex: 1; min-width: 220px; text-align: center; background: #fff; padding: 28px 20px; border-radius: var(--radius); box-shadow: var(--shadow); position: relative; }
        .step-card:not(:last-child)::after { content: '→'; position: absolute; right: -16px; top: 50%; transform: translateY(-50%); font-size: 24px; color: var(--accent); font-weight: 700; }
        .step-icon { width: 64px; height: 64px; background: linear-gradient(135deg, var(--primary), var(--primary-light)); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 16px; }
        .step-card h3 { font-size: 18px; font-weight: 700; margin-bottom: 8px; color: var(--text); }
        .step-card p { font-size: 14px; color: var(--muted); line-height: 1.5; }

        /* TESTIMONIALS */
        .testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; }
        .testimonial-card { background: #fff; padding: 28px; border-radius: var(--radius); box-shadow: var(--shadow); border-top: 4px solid var(--accent); position: relative; }
        .testimonial-card::before { content: '"'; font-size: 64px; color: var(--accent); opacity: 0.2; position: absolute; top: 12px; left: 20px; font-family: Georgia, serif; }
        .testimonial-text { font-size: 15px; color: var(--text); line-height: 1.7; margin-bottom: 20px; font-style: italic; position: relative; z-index: 1; }
        .testimonial-author { display: flex; align-items: center; gap: 12px; }
        .author-avatar { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--primary-light)); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 18px; }
        .author-info h4 { font-size: 15px; font-weight: 700; color: var(--text); }
        .author-info p { font-size: 13px; color: var(--muted); }

        /* AGENCIES */
        .ph2-agencies-cta { background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%); color: #fff; text-align: center; border-radius: var(--radius); padding: 60px 40px; margin: 80px auto; max-width: 1200px; }
        .ph2-agencies-cta h2 { font-size: 28px; font-weight: 800; margin-bottom: 16px; }
        .ph2-agencies-cta p { font-size: 16px; opacity: 0.95; max-width: 600px; margin: 0 auto 28px; }
        .btn-agencies { background: var(--accent); color: #0f172a; padding: 16px 32px; border-radius: 14px; font-size: 16px; font-weight: 700; cursor: pointer; border: none; transition: 0.3s; display: inline-flex; align-items: center; gap: 10px; text-decoration: none; }
        .btn-agencies:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(251,191,36,0.4); }

        /* FOOTER */
        .ph2-footer { background: var(--text); color: #94a3b8; padding: 60px 20px 30px; text-align: center; }
        .footer-content { max-width: 800px; margin: 0 auto; }
        .footer-logo { font-size: 24px; font-weight: 800; color: #fff; margin-bottom: 16px; }
        .footer-logo span { color: var(--accent); }
        .footer-links { display: flex; justify-content: center; gap: 24px; margin: 24px 0; flex-wrap: wrap; }
        .footer-links a { color: #94a3b8; text-decoration: none; font-size: 14px; transition: 0.2s; }
        .footer-links a:hover { color: var(--accent); }
        .footer-bottom { border-top: 1px solid #334155; padding-top: 24px; margin-top: 32px; font-size: 13px; }

        /* RTL */
        [dir="rtl"] .ph2 { font-family: Tahoma, Arial, sans-serif; }
        [dir="rtl"] .problem-card { border-left: none; border-right: 4px solid var(--danger); }
        [dir="rtl"] .use-case { border-left: none; border-right: 3px solid var(--accent); }
        [dir="rtl"] .step-card:not(:last-child)::after { content: '←'; right: auto; left: -16px; }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .product-showcase { grid-template-columns: 1fr; }
          .comparison-row { grid-template-columns: 1fr; gap: 12px; }
          .comparison-row.header { display: none; }
          .step-card:not(:last-child)::after { display: none; }
          .steps-container { flex-direction: column; }
          .ph2-hero { padding: 120px 20px 60px; }
          .ph2-section, .ph2-problem, .ph2-comparison { padding: 60px 20px; }
          .ph2-nav .ph2-btn-ghost:not(:last-child) { display: none; }
        }
        @media (max-width: 480px) {
          .ph2-header { padding: 10px 14px; }
          .ph2-cta-group { flex-direction: column; }
          .ph2-btn-hero { width: 100%; justify-content: center; }
          .ph2-agencies-cta { padding: 40px 20px; margin: 40px 20px; }
        }
      `}</style>

      <div className="ph2">
        {/* ─── HEADER ─── */}
        <header className="ph2-header">
          <div className="ph2-logo">Pass<span>Hajj</span></div>
          <div className="ph2-nav">
            <button className="ph2-lang-toggle" onClick={cycleLang}>🌐 {lang.toUpperCase()}</button>
            <a href="#produits" className="ph2-btn-ghost">{t('landing.nav.products')}</a>
            <a href="#comment-ca-marche" className="ph2-btn-ghost">{t('landing.nav.howItWorks')}</a>
            <Link href="/login" className="ph2-btn-ghost">{t('landing.nav.login')}</Link>
            <Link href="/select" className="ph2-btn-primary">{t('landing.nav.activate')}</Link>
          </div>
        </header>

        {/* ─── HERO ─── */}
        <section className="ph2-hero">
          <div className="ph2-hero-content">
            <h1>{t('landing.hero.title')}</h1>
            <p>{t('landing.hero.subtitle')}</p>
            <div className="ph2-cta-group">
              <Link href="/select" className="ph2-btn-hero ph2-btn-hero-primary">
                🛡️ {t('landing.hero.ctaPrimary')}
              </Link>
              <a href="#produits" className="ph2-btn-hero ph2-btn-hero-secondary">
                {t('landing.hero.ctaSecondary')}
              </a>
            </div>
          </div>
        </section>

        {/* ─── STATS ─── */}
        <section className="ph2-stats">
          <div className="ph2-stats-grid">
            <div className="stat-card">
              <span className="stat-number">30%</span>
              <span className="stat-label">{t('landing.stats.s1')}</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">15 000+</span>
              <span className="stat-label">{t('landing.stats.s2')}</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">94%</span>
              <span className="stat-label">{t('landing.stats.s3')}</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">&lt; 2h</span>
              <span className="stat-label">{t('landing.stats.s4')}</span>
            </div>
          </div>
        </section>

        {/* ─── PROBLEM ─── */}
        <section className="ph2-problem">
          <div className="ph2-problem-inner">
            <div className="section-header">
              <span className="section-tag">{t('landing.problem.tag')}</span>
              <h2 className="section-title">{t('landing.problem.title')}</h2>
              <p className="section-subtitle">{t('landing.problem.subtitle')}</p>
            </div>
            <div className="problem-grid">
              <div className="problem-card">
                <span className="problem-icon">🧳</span>
                <h3>{t('landing.problem.p1Title')}</h3>
                <p>{t('landing.problem.p1Desc')}</p>
              </div>
              <div className="problem-card">
                <span className="problem-icon">👴</span>
                <h3>{t('landing.problem.p2Title')}</h3>
                <p>{t('landing.problem.p2Desc')}</p>
              </div>
              <div className="problem-card">
                <span className="problem-icon">🏥</span>
                <h3>{t('landing.problem.p3Title')}</h3>
                <p>{t('landing.problem.p3Desc')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── PRODUCTS ─── */}
        <section className="ph2-section" id="produits">
          <div className="section-header">
            <span className="section-tag">{t('landing.products.tag')}</span>
            <h2 className="section-title">{t('landing.products.title')}</h2>
            <p className="section-subtitle">{t('landing.products.subtitle')}</p>
          </div>

          <div className="product-showcase">
            {/* PASS BAGAGE */}
            <div className="product-card">
              <div className="product-header">
                <span className="product-icon-large">🧳</span>
                <h3>{t('landing.products.bagageTitle')}</h3>
                <p>{t('landing.products.bagageSub')}</p>
              </div>
              <div className="product-body">
                <p className="product-description">{t('landing.products.bagageDesc')}</p>
                <div className="how-it-works">
                  <h4>{t('landing.products.howItWorks')}</h4>
                  <div className="ph2-step">
                    <div className="step-num">1</div>
                    <div className="step-text">{t('landing.products.bagageStep1')}</div>
                  </div>
                  <div className="ph2-step">
                    <div className="step-num">2</div>
                    <div className="step-text">{t('landing.products.bagageStep2')}</div>
                  </div>
                  <div className="ph2-step">
                    <div className="step-num">3</div>
                    <div className="step-text">{t('landing.products.bagageStep3')}</div>
                  </div>
                </div>
                <div className="use-case">
                  <h5>{t('landing.products.useCase')}</h5>
                  <p>{t('landing.products.bagageUseCase')}</p>
                </div>
              </div>
              <div className="product-footer">
                <Link href="/activate/baggage" className="btn-product btn-product-primary">
                  {t('landing.products.bagageCta')} →
                </Link>
              </div>
            </div>

            {/* PASS IDENTITY */}
            <div className="product-card">
              <div className="product-header" style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}>
                <span className="product-icon-large">👤</span>
                <h3>{t('landing.products.identityTitle')}</h3>
                <p>{t('landing.products.identitySub')}</p>
              </div>
              <div className="product-body">
                <p className="product-description">{t('landing.products.identityDesc')}</p>
                <div className="how-it-works">
                  <h4>{t('landing.products.howItWorks')}</h4>
                  <div className="ph2-step">
                    <div className="step-num">1</div>
                    <div className="step-text">{t('landing.products.identityStep1')}</div>
                  </div>
                  <div className="ph2-step">
                    <div className="step-num">2</div>
                    <div className="step-text">{t('landing.products.identityStep2')}</div>
                  </div>
                  <div className="ph2-step">
                    <div className="step-num">3</div>
                    <div className="step-text">{t('landing.products.identityStep3')}</div>
                  </div>
                </div>
                <div className="use-case">
                  <h5>{t('landing.products.useCase')}</h5>
                  <p>{t('landing.products.identityUseCase')}</p>
                </div>
              </div>
              <div className="product-footer">
                <Link href="/activate/identity" className="btn-product" style={{ background: '#059669', color: '#fff' }}>
                  {t('landing.products.identityCta')} →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── COMPARISON ─── */}
        <section className="ph2-comparison">
          <div className="ph2-comparison-inner">
            <div className="section-header">
              <span className="section-tag">{t('landing.comparison.tag')}</span>
              <h2 className="section-title">{t('landing.comparison.title')}</h2>
            </div>
            <div className="comparison-table">
              <div className="comparison-row header">
                <div className="comparison-cell">{t('landing.comparison.feature')}</div>
                <div className="comparison-cell">Pass Bagage</div>
                <div className="comparison-cell">Pass Identity</div>
              </div>
              <div className="comparison-row">
                <div className="comparison-cell">{t('landing.comparison.forWho')}</div>
                <div className="comparison-cell">{t('landing.comparison.bagageFor')}</div>
                <div className="comparison-cell">{t('landing.comparison.identityFor')}</div>
              </div>
              <div className="comparison-row">
                <div className="comparison-cell">{t('landing.comparison.whatsapp')}</div>
                <div className="comparison-cell check">✓</div>
                <div className="comparison-cell check">✓</div>
              </div>
              <div className="comparison-row">
                <div className="comparison-cell">{t('landing.comparison.gps')}</div>
                <div className="comparison-cell check">✓</div>
                <div className="comparison-cell check">✓</div>
              </div>
              <div className="comparison-row">
                <div className="comparison-cell">{t('landing.comparison.medical')}</div>
                <div className="comparison-cell cross">✗</div>
                <div className="comparison-cell check">✓</div>
              </div>
              <div className="comparison-row">
                <div className="comparison-cell">{t('landing.comparison.photo')}</div>
                <div className="comparison-cell check">✓</div>
                <div className="comparison-cell check">✓</div>
              </div>
              <div className="comparison-row">
                <div className="comparison-cell">{t('landing.comparison.remoteEdit')}</div>
                <div className="comparison-cell check">✓</div>
                <div className="comparison-cell check">✓</div>
              </div>
              <div className="comparison-row">
                <div className="comparison-cell">{t('landing.comparison.price')}</div>
                <div className="comparison-cell">2 500 FCFA</div>
                <div className="comparison-cell">5 000 FCFA</div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section className="ph2-section" id="comment-ca-marche">
          <div className="section-header">
            <span className="section-tag">{t('landing.how.tag')}</span>
            <h2 className="section-title">{t('landing.how.title')}</h2>
            <p className="section-subtitle">{t('landing.how.subtitle')}</p>
          </div>
          <div className="steps-container">
            <div className="step-card">
              <div className="step-icon">🔑</div>
              <h3>{t('landing.how.s1Title')}</h3>
              <p>{t('landing.how.s1Desc')}</p>
            </div>
            <div className="step-card">
              <div className="step-icon">🛡️</div>
              <h3>{t('landing.how.s2Title')}</h3>
              <p>{t('landing.how.s2Desc')}</p>
            </div>
            <div className="step-card">
              <div className="step-icon">🚨</div>
              <h3>{t('landing.how.s3Title')}</h3>
              <p>{t('landing.how.s3Desc')}</p>
            </div>
          </div>
        </section>

        {/* ─── TESTIMONIALS ─── */}
        <section className="ph2-section">
          <div className="section-header">
            <span className="section-tag">{t('landing.testimonials.tag')}</span>
            <h2 className="section-title">{t('landing.testimonials.title')}</h2>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <p className="testimonial-text">{t('landing.testimonials.t1Text')}</p>
              <div className="testimonial-author">
                <div className="author-avatar">AF</div>
                <div className="author-info">
                  <h4>{t('landing.testimonials.t1Name')}</h4>
                  <p>{t('landing.testimonials.t1Info')}</p>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <p className="testimonial-text">{t('landing.testimonials.t2Text')}</p>
              <div className="testimonial-author">
                <div className="author-avatar">FD</div>
                <div className="author-info">
                  <h4>{t('landing.testimonials.t2Name')}</h4>
                  <p>{t('landing.testimonials.t2Info')}</p>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <p className="testimonial-text">{t('landing.testimonials.t3Text')}</p>
              <div className="testimonial-author">
                <div className="author-avatar">MN</div>
                <div className="author-info">
                  <h4>{t('landing.testimonials.t3Name')}</h4>
                  <p>{t('landing.testimonials.t3Info')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── AGENCIES CTA ─── */}
        <div style={{ padding: '0 20px' }}>
          <div className="ph2-agencies-cta">
            <h2>🏢 {t('landing.agencies.title')}</h2>
            <p>{t('landing.agencies.desc')}</p>
            <Link href="/agencies" className="btn-agencies">
              {t('landing.agencies.cta')} →
            </Link>
          </div>
        </div>

        {/* ─── FOOTER ─── */}
        <footer className="ph2-footer">
          <div className="footer-content">
            <div className="footer-logo">Pass<span>Hajj</span></div>
            <p>{t('landing.footer.tagline')}</p>
            <div className="footer-links">
              <Link href="/confidentialite">{t('landing.footer.privacy')}</Link>
              <Link href="/cgu">{t('landing.footer.terms')}</Link>
              <Link href="/contact">{t('landing.footer.support')}</Link>
              <Link href="/contact">{t('landing.footer.contact')}</Link>
              <Link href="/demo">{t('landing.footer.demo')}</Link>
            </div>
            <div className="footer-bottom">
              <p>© 2026 PassHajj. {t('landing.footer.rights')}</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
