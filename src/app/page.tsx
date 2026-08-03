'use client';

import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import type { Language } from '@/lib/i18n';

export default function HomePage() {
  const { t, lang, setLang, dir } = useTranslation();

  const cycleLang = () => {
    const next: Record<Language, Language> = { fr: 'en', en: 'ar', ar: 'fr' };
    setLang(next[lang]);
  };

  return (
    <div lang={lang} dir={dir} style={{ fontFamily: 'inherit' }}>
      <style>{`
        :root {
          --bg: #f4b400;
          --card: #ffffff;
          --text: #0f172a;
          --muted: #475569;
          --primary: #0f172a;
          --accent: #10b981;
          --radius: 20px;
          --shadow: 0 8px 24px rgba(0,0,0,0.08);
          --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        .ph-wrapper * { box-sizing: border-box; margin: 0; padding: 0; font-family: var(--font); }
        .ph-wrapper { background: var(--bg); color: var(--text); line-height: 1.5; overflow-x: hidden; }

        /* HEADER */
        .ph-header {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: rgba(244, 180, 0, 0.95); backdrop-filter: blur(8px);
          padding: 14px 20px; display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        .ph-logo { font-size: 22px; font-weight: 800; color: #000; letter-spacing: -0.5px; }
        .ph-logo span { background: #000; color: #fff; padding: 2px 6px; border-radius: 6px; margin-right: 4px; }
        .ph-nav-actions { display: flex; gap: 12px; align-items: center; }
        .ph-btn-ghost { background: transparent; border: 1.5px solid rgba(0,0,0,0.2); padding: 8px 14px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; color: #000; transition: 0.2s; text-decoration: none; }
        .ph-btn-ghost:hover { border-color: #000; background: rgba(0,0,0,0.05); }
        .ph-lang-toggle { background: rgba(255,255,255,0.4); border: none; padding: 6px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; }

        /* HERO */
        .ph-hero {
          padding: 120px 20px 60px; text-align: center; max-width: 800px; margin: 0 auto;
          animation: phFadeUp 0.8s ease;
        }
        @keyframes phFadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .ph-hero h1 { font-size: clamp(28px, 5vw, 42px); font-weight: 800; line-height: 1.2; margin-bottom: 16px; letter-spacing: -0.5px; }
        .ph-hero p { font-size: 16px; color: var(--muted); max-width: 600px; margin: 0 auto 28px; font-weight: 500; }
        .ph-cta-group { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .ph-btn { padding: 14px 24px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: 0.2s; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
        .ph-btn-primary { background: #000; color: #fff; }
        .ph-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.2); }
        .ph-btn-outline { background: #fff; color: #000; border: 2px solid rgba(0,0,0,0.1); }
        .ph-btn-outline:hover { border-color: #000; background: #fafafa; }

        /* BENEFITS */
        .ph-benefits { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; max-width: 900px; margin: 40px auto; padding: 0 20px; }
        .ph-benefit-card { background: var(--card); padding: 24px; border-radius: var(--radius); box-shadow: var(--shadow); text-align: center; transition: 0.3s; }
        .ph-benefit-card:hover { transform: translateY(-4px); }
        .ph-icon { font-size: 32px; margin-bottom: 12px; display: block; }
        .ph-benefit-card h3 { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
        .ph-benefit-card p { font-size: 14px; color: var(--muted); }

        /* PRODUCTS */
        .ph-products { max-width: 900px; margin: 60px auto; padding: 0 20px; }
        .ph-section-title { text-align: center; font-size: 24px; font-weight: 800; margin-bottom: 32px; }
        .ph-product-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
        .ph-product-card { background: var(--card); border-radius: var(--radius); padding: 28px; box-shadow: var(--shadow); position: relative; overflow: hidden; transition: 0.3s; border: 2px solid transparent; }
        .ph-product-card:hover { transform: translateY(-4px); border-color: #000; }
        .ph-product-badge { position: absolute; top: 16px; right: 16px; background: var(--accent); color: #fff; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .ph-product-icon { width: 56px; height: 56px; background: #f8fafc; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 16px; }
        .ph-product-card h3 { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
        .ph-product-card p { color: var(--muted); font-size: 14px; margin-bottom: 20px; line-height: 1.5; }
        .ph-features { list-style: none; margin-bottom: 20px; }
        .ph-features li { font-size: 13px; padding: 6px 0; display: flex; align-items: center; gap: 8px; color: var(--muted); }
        .ph-features li::before { content: "✓"; color: var(--accent); font-weight: 800; }

        /* HOW IT WORKS */
        .ph-steps { max-width: 800px; margin: 60px auto; padding: 0 20px; text-align: center; }
        .ph-step-grid { display: flex; justify-content: center; gap: 32px; flex-wrap: wrap; margin-top: 32px; }
        .ph-step { flex: 1; min-width: 200px; }
        .ph-step-num { width: 40px; height: 40px; background: #000; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; margin: 0 auto 12px; }
        .ph-step h4 { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
        .ph-step p { font-size: 14px; color: var(--muted); }

        /* AGENCIES */
        .ph-agencies { background: rgba(255,255,255,0.4); margin: 60px 20px; padding: 40px 20px; border-radius: var(--radius); text-align: center; max-width: 900px; margin-left: auto; margin-right: auto; }
        .ph-agencies h2 { font-size: 22px; font-weight: 800; margin-bottom: 12px; }
        .ph-agencies p { color: var(--muted); max-width: 600px; margin: 0 auto 24px; }

        /* FOOTER */
        .ph-footer { text-align: center; padding: 40px 20px; font-size: 13px; color: rgba(0,0,0,0.5); border-top: 1px solid rgba(0,0,0,0.05); margin-top: 40px; }
        .ph-footer a { color: #000; font-weight: 600; text-decoration: underline; margin: 0 6px; }

        /* RTL & MOBILE */
        [dir="rtl"] .ph-wrapper { font-family: Tahoma, Arial, sans-serif; }
        @media (max-width: 600px) {
          .ph-hero { padding-top: 100px; }
          .ph-cta-group { flex-direction: column; }
          .ph-btn { width: 100%; justify-content: center; }
          .ph-step-grid { flex-direction: column; gap: 24px; }
        }
      `}</style>

      <div className="ph-wrapper">
        {/* ─── HEADER ─── */}
        <header className="ph-header">
          <div className="ph-logo"><span>Pass</span>Hajj</div>
          <div className="ph-nav-actions">
            <button className="ph-lang-toggle" onClick={cycleLang}>🌐 {lang.toUpperCase()}</button>
            <Link href="/login" className="ph-btn-ghost">{t('landing.nav.login')}</Link>
            <Link href="/select" className="ph-btn-ghost" style={{ background: '#000', color: '#fff', border: 'none' }}>{t('landing.nav.activate')}</Link>
          </div>
        </header>

        {/* ─── HERO ─── */}
        <section className="ph-hero">
          <h1>{t('landing.hero.title1')}<br/>{t('landing.hero.title2')}</h1>
          <p>{t('landing.hero.subtitle')}</p>
          <div className="ph-cta-group">
            <Link href="/select" className="ph-btn ph-btn-primary">{t('landing.hero.cta_primary')}</Link>
            <Link href="/agencies" className="ph-btn ph-btn-outline">{t('landing.hero.cta_secondary')}</Link>
          </div>
        </section>

        {/* ─── BENEFITS ─── */}
        <section className="ph-benefits">
          <div className="ph-benefit-card">
            <span className="ph-icon">{t('landing.benefits.b1_icon')}</span>
            <h3>{t('landing.benefits.b1_title')}</h3>
            <p>{t('landing.benefits.b1_desc')}</p>
          </div>
          <div className="ph-benefit-card">
            <span className="ph-icon">{t('landing.benefits.b2_icon')}</span>
            <h3>{t('landing.benefits.b2_title')}</h3>
            <p>{t('landing.benefits.b2_desc')}</p>
          </div>
          <div className="ph-benefit-card">
            <span className="ph-icon">{t('landing.benefits.b3_icon')}</span>
            <h3>{t('landing.benefits.b3_title')}</h3>
            <p>{t('landing.benefits.b3_desc')}</p>
          </div>
        </section>

        {/* ─── PRODUCTS ─── */}
        <section className="ph-products">
          <h2 className="ph-section-title">{t('landing.products.title')}</h2>
          <div className="ph-product-grid">
            <div className="ph-product-card">
              <div className="ph-product-icon">🧳</div>
              <h3>{t('landing.products.bagage_title')}</h3>
              <p>{t('landing.products.bagage_desc')}</p>
              <ul className="ph-features">
                <li>{t('landing.products.bagage_f1')}</li>
                <li>{t('landing.products.bagage_f2')}</li>
                <li>{t('landing.products.bagage_f3')}</li>
              </ul>
              <Link href="/activate/baggage" className="ph-btn ph-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>{t('landing.products.bagage_cta')}</Link>
            </div>

            <div className="ph-product-card">
              <div className="ph-product-badge">{t('landing.products.identity_badge')}</div>
              <div className="ph-product-icon">👤</div>
              <h3>{t('landing.products.identity_title')}</h3>
              <p>{t('landing.products.identity_desc')}</p>
              <ul className="ph-features">
                <li>{t('landing.products.identity_f1')}</li>
                <li>{t('landing.products.identity_f2')}</li>
                <li>{t('landing.products.identity_f3')}</li>
              </ul>
              <Link href="/activate/identity" className="ph-btn ph-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>{t('landing.products.identity_cta')}</Link>
            </div>
          </div>
        </section>

        {/* ─── STEPS ─── */}
        <section className="ph-steps">
          <h2 className="ph-section-title">{t('landing.steps.title')}</h2>
          <div className="ph-step-grid">
            <div className="ph-step">
              <div className="ph-step-num">1</div>
              <h4>{t('landing.steps.s1_title')}</h4>
              <p>{t('landing.steps.s1_desc')}</p>
            </div>
            <div className="ph-step">
              <div className="ph-step-num">2</div>
              <h4>{t('landing.steps.s2_title')}</h4>
              <p>{t('landing.steps.s2_desc')}</p>
            </div>
            <div className="ph-step">
              <div className="ph-step-num">3</div>
              <h4>{t('landing.steps.s3_title')}</h4>
              <p>{t('landing.steps.s3_desc')}</p>
            </div>
          </div>
        </section>

        {/* ─── AGENCIES ─── */}
        <section className="ph-agencies">
          <h2>{t('landing.agencies.title')}</h2>
          <p>{t('landing.agencies.desc')}</p>
          <Link href="/agencies" className="ph-btn ph-btn-outline">{t('landing.agencies.cta')}</Link>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="ph-footer">
          <p>{t('landing.footer.copyright')}</p>
          <p style={{ marginTop: '8px' }}>
            <Link href="/privacy">{t('landing.footer.privacy')}</Link> ·
            <Link href="/terms">{t('landing.footer.terms')}</Link> ·
            <Link href="/support">{t('landing.footer.support')}</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
