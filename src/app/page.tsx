'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import type { Language } from '@/lib/i18n';
import dynamic from 'next/dynamic';

const ProblemDetailDialog = dynamic(
  () => import('@/components/home/ProblemDetailDialog'),
  { ssr: false }
);

export default function HomePage() {
  const { t, lang, setLang, dir } = useTranslation();
  const mainRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [problemDialog, setProblemDialog] = useState<'bagages' | 'personnes' | 'urgences' | null>(null);

  const cycleLang = () => {
    const next: Record<Language, Language> = { fr: 'en', en: 'ar', ar: 'fr' };
    setLang(next[lang]);
  };

  const langLabels: Record<Language, string> = { fr: 'FR', en: 'EN', ar: 'AR' };

  /* Scroll-reveal animation */
  useEffect(() => {
    if (!mainRef.current) return;
    const els = mainRef.current.querySelectorAll<HTMLElement>('.reveal');
    els.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
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
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' },
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div lang={lang} dir={dir} ref={mainRef} className="min-h-screen flex flex-col">
      <style>{`
        :root {
          --brand: #f4b400;
          --brand-dark: #d49b00;
          --brand-light: #fff8e1;
          --navy: #0c1d3a;
          --navy-light: #1e3a5f;
          --ink: #0f172a;
          --muted: #64748b;
          --surface: #ffffff;
          --surface-alt: #f8fafc;
          --success: #10b981;
          --danger: #ef4444;
          --radius: 16px;
          --radius-sm: 10px;
          --shadow: 0 4px 16px rgba(0,0,0,0.06);
          --shadow-lg: 0 12px 40px rgba(12,29,58,0.12);
        }
        html { scroll-behavior: smooth; }

        .hk * { box-sizing: border-box; margin: 0; padding: 0; }
        .hk {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans Arabic", sans-serif;
          color: var(--ink);
          line-height: 1.6;
          overflow-x: hidden;
          background: var(--surface);
        }

        /* ─── HEADER ─── */
        .hk-header {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: rgba(255,255,255,0.97); backdrop-filter: blur(12px);
          padding: 0 24px; height: 64px;
          display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid rgba(0,0,0,0.06);
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .hk-logo {
          font-size: 24px; font-weight: 900; letter-spacing: -0.5px;
          color: var(--navy);
        }
        .hk-logo span { color: var(--brand); }
        .hk-nav { display: flex; gap: 8px; align-items: center; }
        .hk-nav-link {
          background: transparent; border: none; padding: 8px 14px;
          border-radius: var(--radius-sm); font-size: 14px; font-weight: 600;
          cursor: pointer; color: var(--ink); transition: all 0.2s;
          text-decoration: none;
        }
        .hk-nav-link:hover { background: var(--brand-light); color: var(--navy); }
        .hk-btn-cta {
          background: var(--brand); color: var(--ink); border: none;
          padding: 8px 18px; border-radius: var(--radius-sm);
          font-size: 14px; font-weight: 700; cursor: pointer;
          transition: all 0.25s; text-decoration: none;
          box-shadow: 0 2px 8px rgba(244,180,0,0.3);
        }
        .hk-btn-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(244,180,0,0.4);
        }
        .hk-lang {
          background: rgba(12,29,58,0.06); border: none;
          padding: 6px 10px; border-radius: 20px;
          font-size: 12px; font-weight: 700; cursor: pointer;
          color: var(--navy); transition: 0.2s;
        }
        .hk-lang:hover { background: rgba(12,29,58,0.12); }
        .hk-hamburger {
          display: none; background: none; border: none;
          width: 36px; height: 36px; cursor: pointer;
          color: var(--ink); font-size: 22px;
        }
        .hk-mobile-menu {
          display: none; position: fixed; top: 64px; left: 0; right: 0;
          background: #fff; border-bottom: 1px solid #e2e8f0;
          padding: 16px 24px; z-index: 99;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          flex-direction: column; gap: 8px;
        }
        .hk-mobile-menu.open { display: flex; }

        /* ─── HERO ─── */
        .hk-hero {
          position: relative; margin-top: 64px;
          min-height: 540px; display: flex; align-items: center;
          overflow: hidden;
        }
        .hk-hero-bg {
          position: absolute; inset: 0; z-index: 0;
        }
        .hk-hero-bg img {
          width: 100%; height: 100%; object-fit: cover;
        }
        .hk-hero-overlay {
          position: absolute; inset: 0; z-index: 1;
          background: linear-gradient(135deg, rgba(12,29,58,0.88) 0%, rgba(12,29,58,0.7) 40%, rgba(12,29,58,0.4) 100%);
        }
        .hk-hero-inner {
          position: relative; z-index: 2;
          max-width: 1200px; margin: 0 auto;
          padding: 60px 24px 60px;
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 48px; align-items: center;
        }
        .hk-hero-text h1 {
          font-size: clamp(28px, 4.5vw, 46px);
          font-weight: 900; color: #fff;
          line-height: 1.15; margin-bottom: 20px;
          letter-spacing: -0.5px;
        }
        .hk-hero-text h1 em {
          font-style: normal; color: var(--brand);
        }
        .hk-hero-text p {
          font-size: 17px; color: rgba(255,255,255,0.88);
          max-width: 520px; margin-bottom: 32px; line-height: 1.7;
        }
        .hk-hero-actions { display: flex; gap: 14px; flex-wrap: wrap; }
        .hk-hero-btn {
          padding: 14px 28px; border-radius: 12px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          border: none; transition: all 0.3s;
          text-decoration: none; display: inline-flex;
          align-items: center; gap: 8px;
        }
        .hk-hero-btn-primary {
          background: var(--brand); color: var(--ink);
          box-shadow: 0 4px 20px rgba(244,180,0,0.4);
        }
        .hk-hero-btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 28px rgba(244,180,0,0.5);
        }
        .hk-hero-btn-secondary {
          background: rgba(255,255,255,0.12); color: #fff;
          border: 2px solid rgba(255,255,255,0.25);
          backdrop-filter: blur(4px);
        }
        .hk-hero-btn-secondary:hover {
          background: rgba(255,255,255,0.2);
          border-color: #fff;
        }
        .hk-hero-visual {
          display: flex; justify-content: center; align-items: center;
        }
        .hk-hero-visual img {
          width: 100%; max-width: 480px; border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          border: 3px solid rgba(255,255,255,0.15);
        }
        .hk-hero-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(244,180,0,0.15); color: var(--brand);
          padding: 6px 14px; border-radius: 20px;
          font-size: 13px; font-weight: 700; margin-bottom: 16px;
          border: 1px solid rgba(244,180,0,0.3);
        }

        /* ─── STATS BAR ─── */
        .hk-stats {
          background: var(--navy); padding: 40px 24px;
          position: relative; overflow: hidden;
        }
        .hk-stats::before {
          content: ''; position: absolute; inset: 0;
          background: repeating-linear-gradient(
            90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 80px
          );
        }
        .hk-stats-inner {
          max-width: 1200px; margin: 0 auto; position: relative;
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;
        }
        .hk-stat {
          text-align: center; padding: 16px;
          border-radius: var(--radius-sm);
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .hk-stat-number {
          font-size: clamp(28px, 3vw, 40px); font-weight: 900;
          color: var(--brand); display: block; margin-bottom: 4px;
        }
        .hk-stat-label {
          font-size: 13px; color: rgba(255,255,255,0.7);
          font-weight: 500; line-height: 1.4;
        }

        /* ─── SECTION COMMON ─── */
        .hk-section {
          padding: 80px 24px; max-width: 1200px; margin: 0 auto;
        }
        .hk-section-alt { background: var(--surface-alt); padding: 80px 24px; }
        .hk-section-alt-inner { max-width: 1200px; margin: 0 auto; }
        .hk-section-header { text-align: center; margin-bottom: 56px; }
        .hk-tag {
          display: inline-block; background: var(--brand-light);
          color: var(--navy); padding: 6px 16px;
          border-radius: 20px; font-size: 12px; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.8px;
          margin-bottom: 14px; border: 1px solid rgba(244,180,0,0.2);
        }
        .hk-title {
          font-size: clamp(26px, 4vw, 38px); font-weight: 900;
          color: var(--ink); margin-bottom: 14px;
          letter-spacing: -0.5px; line-height: 1.2;
        }
        .hk-subtitle {
          font-size: 16px; color: var(--muted);
          max-width: 640px; margin: 0 auto; line-height: 1.7;
        }

        /* ─── PROBLEM ─── */
        .hk-problems-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
        }
        .hk-problem {
          padding: 28px; border-radius: var(--radius);
          box-shadow: var(--shadow-lg); position: relative;
          overflow: hidden; transition: all 0.3s;
          border: 2px solid transparent;
        }
        .hk-problem:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(12,29,58,0.15); }
        .hk-problem--bagages { background: linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%); border-color: #fbbf24; }
        .hk-problem--personnes { background: linear-gradient(145deg, #eff6ff 0%, #dbeafe 100%); border-color: #60a5fa; }
        .hk-problem--urgences { background: linear-gradient(145deg, #fef2f2 0%, #fee2e2 100%); border-color: #f87171; }
        .hk-problem::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
        }
        .hk-problem--bagages::before { background: #fbbf24; }
        .hk-problem--personnes::before { background: #3b82f6; }
        .hk-problem--urgences::before { background: #ef4444; }
        .hk-problem-icon {
          width: 56px; height: 56px;
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; margin-bottom: 18px;
        }
        .hk-problem--bagages .hk-problem-icon { background: rgba(251,191,36,0.15); }
        .hk-problem--personnes .hk-problem-icon { background: rgba(59,130,246,0.12); }
        .hk-problem--urgences .hk-problem-icon { background: rgba(239,68,68,0.12); }
        .hk-problem h3 { font-size: 18px; font-weight: 700; margin-bottom: 10px; }
        .hk-problem--bagages h3 { color: #92400e; }
        .hk-problem--personnes h3 { color: #1e40af; }
        .hk-problem--urgences h3 { color: #991b1b; }
        .hk-problem p { font-size: 14px; color: #475569; line-height: 1.7; }
        .hk-problem--clickable { cursor: pointer; outline: none; }
        .hk-problem--clickable:hover { border-color: var(--brand) !important; }
        .hk-problem--clickable:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
        .hk-problem-more {
          display: inline-flex; align-items: center; gap: 4px;
          margin-top: 12px; font-size: 13px; font-weight: 700;
          color: var(--brand-dark); transition: gap 0.2s;
        }
        .hk-problem--clickable:hover .hk-problem-more { gap: 8px; }

        /* ─── PRODUCTS ─── */
        .hk-products-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 32px;
        }
        .hk-product {
          background: #fff; border-radius: var(--radius);
          overflow: hidden; box-shadow: var(--shadow-lg);
          border: 1px solid #e2e8f0; transition: all 0.3s;
        }
        .hk-product:hover { transform: translateY(-6px); box-shadow: 0 16px 48px rgba(12,29,58,0.14); }
        .hk-product-top {
          padding: 32px; text-align: center; color: #fff;
          position: relative; overflow: hidden;
        }
        .hk-product-top--bagage {
          background: linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%);
        }
        .hk-product-top--identity {
          background: linear-gradient(135deg, #065f46 0%, #059669 100%);
        }
        .hk-product-top-icon { font-size: 48px; margin-bottom: 10px; display: block; }
        .hk-product-top h3 { font-size: 22px; font-weight: 800; margin-bottom: 6px; }
        .hk-product-top p { font-size: 14px; opacity: 0.9; }
        .hk-product-body { padding: 28px; }
        .hk-product-desc { font-size: 15px; color: var(--muted); margin-bottom: 24px; line-height: 1.7; }
        .hk-how-title { font-size: 15px; font-weight: 700; margin-bottom: 14px; color: var(--ink); }
        .hk-step { display: flex; gap: 12px; margin-bottom: 12px; align-items: flex-start; }
        .hk-step-num {
          width: 28px; height: 28px; background: var(--brand); color: var(--ink);
          border-radius: 50%; display: flex; align-items: center;
          justify-content: center; font-weight: 800; font-size: 13px;
          flex-shrink: 0;
        }
        .hk-step-text { font-size: 14px; color: var(--muted); padding-top: 4px; }
        .hk-use-case {
          background: var(--surface-alt); padding: 16px;
          border-radius: 12px; border-left: 3px solid var(--brand);
          margin-top: 20px;
        }
        .hk-use-case h5 { font-size: 14px; font-weight: 700; margin-bottom: 6px; }
        .hk-use-case p { font-size: 13px; color: var(--muted); line-height: 1.6; }
        .hk-product-footer {
          padding: 20px 28px; border-top: 1px solid #e2e8f0;
        }
        .hk-product-btn {
          width: 100%; padding: 14px; border-radius: 12px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          border: none; transition: all 0.25s;
          text-decoration: none; display: flex;
          align-items: center; justify-content: center; gap: 8px;
        }
        .hk-product-btn--bagage { background: var(--navy); color: #fff; }
        .hk-product-btn--bagage:hover { background: var(--navy-light); }
        .hk-product-btn--identity { background: #059669; color: #fff; }
        .hk-product-btn--identity:hover { background: #047857; }

        /* ─── COMPARISON ─── */
        .hk-comparison-table {
          background: #fff; border-radius: var(--radius);
          overflow: hidden; box-shadow: var(--shadow-lg);
          border: 1px solid #e2e8f0;
        }
        .hk-comp-row {
          display: grid; grid-template-columns: 1.5fr 1fr 1fr;
          padding: 18px 28px; border-bottom: 1px solid #f1f5f9;
          align-items: center;
        }
        .hk-comp-row--header {
          background: linear-gradient(135deg, var(--navy), var(--navy-light)); color: #fff;
          font-weight: 700; font-size: 15px;
        }
        .hk-comp-row:nth-child(even) { background: #f8fafc; }
        .hk-comp-row:last-child { border-bottom: none; }
        .hk-comp-cell { font-size: 14px; }
        .hk-comp-cell--yes { color: var(--success); font-weight: 800; font-size: 18px; }
        .hk-comp-cell--no { color: var(--danger); font-weight: 800; font-size: 18px; }
        .hk-comp-product {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          font-size: 15px; font-weight: 800;
        }
        .hk-comp-product-icon { font-size: 22px; }

        /* ─── HOW IT WORKS ─── */
        .hk-steps-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px;
        }
        .hk-step-card {
          text-align: center; background: #fff;
          padding: 32px 24px; border-radius: var(--radius);
          box-shadow: var(--shadow); position: relative;
          transition: all 0.3s; border: 1px solid #e2e8f0;
        }
        .hk-step-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
        .hk-step-icon {
          width: 120px; height: 120px; margin: 0 auto 20px;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(12,29,58,0.15);
          border: 2px solid #e2e8f0;
        }
        .hk-step-icon img {
          width: 100%; height: 100%; object-fit: cover;
        }
        .hk-step-card h3 { font-size: 18px; font-weight: 700; margin-bottom: 10px; }
        .hk-step-card p { font-size: 14px; color: var(--muted); line-height: 1.7; }
        .hk-step-connector {
          position: absolute; top: 50%; right: -18px;
          width: 36px; height: 36px; background: var(--brand);
          border-radius: 50%; display: flex; align-items: center;
          justify-content: center; font-size: 14px; color: var(--ink);
          font-weight: 800; z-index: 2;
          box-shadow: 0 4px 12px rgba(244,180,0,0.3);
        }

        /* ─── TESTIMONIALS ─── */
        .hk-testimonials-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
        }
        .hk-testimonial {
          background: #fff; padding: 28px; border-radius: var(--radius);
          box-shadow: var(--shadow); position: relative;
          border-top: 4px solid var(--brand); transition: all 0.3s;
        }
        .hk-testimonial:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
        .hk-testimonial::before {
          content: '"'; font-size: 64px; color: var(--brand);
          opacity: 0.15; position: absolute; top: 8px; left: 18px;
          font-family: Georgia, serif; line-height: 1;
        }
        .hk-testimonial-text {
          font-size: 15px; line-height: 1.8; margin-bottom: 20px;
          font-style: italic; color: var(--ink); position: relative; z-index: 1;
        }
        .hk-testimonial-author { display: flex; align-items: center; gap: 12px; }
        .hk-avatar {
          width: 48px; height: 48px; border-radius: 50%;
          background: linear-gradient(135deg, var(--navy), var(--navy-light));
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 16px;
        }
        .hk-author-info h4 { font-size: 15px; font-weight: 700; }
        .hk-author-info p { font-size: 13px; color: var(--muted); }

        /* ─── AGENCIES CTA ─── */
        .hk-agencies {
          background: linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%);
          color: #fff; text-align: center;
          border-radius: var(--radius); padding: 64px 40px;
          margin: 80px auto; max-width: 1200px;
          position: relative; overflow: hidden;
        }
        .hk-agencies::before {
          content: ''; position: absolute; inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .hk-agencies h2 { font-size: 28px; font-weight: 800; margin-bottom: 16px; position: relative; }
        .hk-agencies p { font-size: 16px; opacity: 0.92; max-width: 600px; margin: 0 auto 28px; position: relative; }
        .hk-agencies-btn {
          background: var(--brand); color: var(--ink);
          padding: 16px 32px; border-radius: 12px;
          font-size: 16px; font-weight: 700; cursor: pointer;
          border: none; transition: all 0.3s;
          display: inline-flex; align-items: center; gap: 10px;
          text-decoration: none; position: relative;
          box-shadow: 0 4px 20px rgba(244,180,0,0.4);
        }
        .hk-agencies-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 28px rgba(244,180,0,0.5);
        }

        /* ─── FOOTER ─── */
        .hk-footer {
          background: var(--navy); color: rgba(255,255,255,0.6);
          padding: 48px 24px 24px; margin-top: auto;
        }
        .hk-footer-grid {
          display: grid; grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 32px; max-width: 900px; margin: 0 auto 32px;
        }
        @media (max-width: 768px) {
          .hk-footer-grid { grid-template-columns: 1fr 1fr; gap: 24px; }
        }
        @media (max-width: 480px) {
          .hk-footer-grid { grid-template-columns: 1fr; gap: 20px; }
        }
        .hk-footer-col h4 {
          font-size: 12px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: rgba(255,255,255,0.75);
          margin-bottom: 12px;
        }
        .hk-footer-col ul { list-style: none; padding: 0; margin: 0; }
        .hk-footer-col li { margin-bottom: 8px; }
        .hk-footer-col a {
          color: rgba(255,255,255,0.5); text-decoration: none;
          font-size: 13px; transition: 0.2s;
        }
        .hk-footer-col a:hover { color: var(--brand); }
        .hk-footer-inner { max-width: 900px; margin: 0 auto; text-align: center; }
        .hk-footer-logo {
          font-size: 24px; font-weight: 900; color: #fff; margin-bottom: 14px;
        }
        .hk-footer-logo span { color: var(--brand); }
        .hk-footer-links {
          display: flex; justify-content: center; gap: 24px;
          margin: 20px 0; flex-wrap: wrap;
        }
        .hk-footer-links a {
          color: rgba(255,255,255,0.6); text-decoration: none;
          font-size: 14px; transition: 0.2s;
        }
        .hk-footer-links a:hover { color: var(--brand); }
        .hk-footer-bottom {
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 24px; margin-top: 32px; font-size: 13px;
        }

        /* ─── RTL ─── */
        [dir="rtl"] .hk { font-family: "Noto Sans Arabic", Tahoma, Arial, sans-serif; }
        [dir="rtl"] .hk-problem::before { left: auto; right: 0; }
        [dir="rtl"] .hk-use-case { border-left: none; border-right: 3px solid var(--brand); }
        [dir="rtl"] .hk-step-connector { right: auto; left: -18px; }
        [dir="rtl"] .hk-hero-inner { direction: rtl; }
        [dir="rtl"] .hk-hero-visual { order: -1; }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 1024px) {
          .hk-hero-inner { grid-template-columns: 1fr; text-align: center; }
          .hk-hero-text p { margin: 0 auto 32px; }
          .hk-hero-actions { justify-content: center; }
          .hk-hero-visual { display: none; }
          .hk-products-grid { grid-template-columns: 1fr; }
          .hk-problems-grid { grid-template-columns: 1fr; }
          .hk-steps-grid { grid-template-columns: 1fr; }
          .hk-testimonials-grid { grid-template-columns: 1fr; }
          .hk-stats-inner { grid-template-columns: repeat(2, 1fr); }
          .hk-step-connector { display: none; }
        }
        @media (max-width: 768px) {
          .hk-nav .hk-nav-link:not(.hk-btn-cta) { display: none; }
          .hk-hamburger { display: block; }
          .hk-comp-row { grid-template-columns: 1fr; gap: 8px; }
          .hk-comp-row--header { display: none; }
          .hk-hero { min-height: 420px; }
          .hk-hero-inner { padding: 40px 20px; }
          .hk-section { padding: 60px 20px; }
          .hk-section-alt { padding: 60px 20px; }
          .hk-stats { padding: 32px 20px; }
        }
        @media (max-width: 480px) {
          .hk-hero-actions { flex-direction: column; width: 100%; }
          .hk-hero-btn { width: 100%; justify-content: center; }
          .hk-stats-inner { grid-template-columns: 1fr 1fr; gap: 12px; }
          .hk-agencies { padding: 40px 20px; margin: 40px 20px; }
          .hk-header { padding: 0 14px; }
        }

        /* ─── ANIMATIONS ─── */
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hk-hero-text h1 { animation: fadeInUp 0.8s ease both; }
        .hk-hero-text p { animation: fadeInUp 0.8s ease 0.15s both; }
        .hk-hero-actions { animation: fadeInUp 0.8s ease 0.3s both; }
      `}</style>

      <div className="hk">
        {/* ─── HEADER ─── */}
        <header className="hk-header">
          <Image src="/logo.png" alt="PassHajj" width={150} height={58} style={{ objectFit: 'contain', borderRadius: '14px', padding: '5px', background: 'rgba(255,255,255,0.9)' }} priority />
          <div className="hk-nav">
            <button className="hk-lang" onClick={cycleLang} title="Switch language">
              🌐 {langLabels[lang]}
            </button>
            <a href="#produits" className="hk-nav-link">{t('landing.nav.products')}</a>
            <a href="#comment-ca-marche" className="hk-nav-link">{t('landing.nav.howItWorks')}</a>
            <Link href="/login" className="hk-nav-link">{t('landing.nav.login')}</Link>
            <Link href="/contact" className="hk-nav-link">{lang === 'ar' ? 'اتصل بنا' : lang === 'en' ? 'Contact' : 'Contact'}</Link>
            <Link href="/select" className="hk-btn-cta">{t('landing.nav.activate')}</Link>
            <button className="hk-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </header>

        {/* Mobile menu */}
        <div className={`hk-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <a href="#produits" className="hk-nav-link" onClick={() => setMobileMenuOpen(false)}>{t('landing.nav.products')}</a>
          <a href="#comment-ca-marche" className="hk-nav-link" onClick={() => setMobileMenuOpen(false)}>{t('landing.nav.howItWorks')}</a>
          <Link href="/login" className="hk-nav-link" onClick={() => setMobileMenuOpen(false)}>{t('landing.nav.login')}</Link>
          <Link href="/contact" className="hk-nav-link" onClick={() => setMobileMenuOpen(false)}>{lang === 'ar' ? 'اتصل بنا' : lang === 'en' ? 'Contact' : 'Contact'}</Link>
          <Link href="/select" className="hk-btn-cta" onClick={() => setMobileMenuOpen(false)}>{t('landing.nav.activate')}</Link>
        </div>

        {/* ─── HERO ─── */}
        <section className="hk-hero">
          <div className="hk-hero-bg">
            <Image
              src="/images/hero-airport.png"
              alt="HAKK - Protection bagages Hajj & Omrah"
              fill
              priority
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className="hk-hero-overlay" />
          <div className="hk-hero-inner">
            <div className="hk-hero-text">
              <div className="hk-hero-badge">
                🛡️ Passeport pour la Mecque
              </div>
              <h1 dangerouslySetInnerHTML={{
                __html: lang === 'ar'
                  ? 'احمِ أمتعتك و<em>عائلتك</em> خلال الحج والعمرة'
                  : lang === 'en'
                    ? 'Protect your luggage & <em>loved ones</em> during Hajj & Umrah'
                    : 'Protégez vos bagages & vos <em>proches</em> pendant le Hajj & l\u2019Omrah'
              }} />
              <p>{t('landing.hero.subtitle')}</p>
              <div className="hk-hero-actions">
                <Link href="/select" className="hk-hero-btn hk-hero-btn-primary">
                  ✈️ {t('landing.hero.ctaPrimary')}
                </Link>
                <a href="#produits" className="hk-hero-btn hk-hero-btn-secondary">
                  {t('landing.hero.ctaSecondary')}
                </a>
              </div>
            </div>
            <div className="hk-hero-visual">
              <Image
                src="/images/hero-products-new.png"
                alt="Pass Bagage & Pass Identity"
                width={480}
                height={274}
                priority
                style={{ width: '100%', maxWidth: '480px', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', border: '3px solid rgba(255,255,255,0.15)' }}
              />
            </div>
          </div>
        </section>

        {/* ─── STATS BAR ─── */}
        <section className="hk-stats">
          <div className="hk-stats-inner">
            <div className="hk-stat reveal">
              <span className="hk-stat-number">30%</span>
              <span className="hk-stat-label">{t('landing.stats.s1')}</span>
            </div>
            <div className="hk-stat reveal">
              <span className="hk-stat-number">15 000+</span>
              <span className="hk-stat-label">{t('landing.stats.s2')}</span>
            </div>
            <div className="hk-stat reveal">
              <span className="hk-stat-number">94%</span>
              <span className="hk-stat-label">{t('landing.stats.s3')}</span>
            </div>
            <div className="hk-stat reveal">
              <span className="hk-stat-number">&lt; 2h</span>
              <span className="hk-stat-label">{t('landing.stats.s4')}</span>
            </div>
          </div>
        </section>

        {/* ─── PROBLEM ─── */}
        <section className="hk-section-alt">
          <div className="hk-section-alt-inner">
            <div className="hk-section-header">
              <span className="hk-tag reveal">{t('landing.problem.tag')}</span>
              <h2 className="hk-title reveal">{t('landing.problem.title')}</h2>
              <p className="hk-subtitle reveal">{t('landing.problem.subtitle')}</p>
            </div>
            <div className="hk-problems-grid">
              <div className="hk-problem hk-problem--bagages reveal hk-problem--clickable" onClick={() => setProblemDialog('bagages')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setProblemDialog('bagages'); }}>
                <div className="hk-problem-icon">🧳</div>
                <h3>{t('landing.problem.p1Title')}</h3>
                <p>{t('landing.problem.p1Desc')}</p>
                <span className="hk-problem-more">{lang === 'ar' ? '← المزيد' : lang === 'en' ? 'Learn more →' : 'En savoir plus →'}</span>
              </div>
              <div className="hk-problem hk-problem--personnes reveal hk-problem--clickable" onClick={() => setProblemDialog('personnes')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setProblemDialog('personnes'); }}>
                <div className="hk-problem-icon">👴</div>
                <h3>{t('landing.problem.p2Title')}</h3>
                <p>{t('landing.problem.p2Desc')}</p>
                <span className="hk-problem-more">{lang === 'ar' ? '← المزيد' : lang === 'en' ? 'Learn more →' : 'En savoir plus →'}</span>
              </div>
              <div className="hk-problem hk-problem--urgences reveal hk-problem--clickable" onClick={() => setProblemDialog('urgences')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setProblemDialog('urgences'); }}>
                <div className="hk-problem-icon">🏥</div>
                <h3>{t('landing.problem.p3Title')}</h3>
                <p>{t('landing.problem.p3Desc')}</p>
                <span className="hk-problem-more">{lang === 'ar' ? '← المزيد' : lang === 'en' ? 'Learn more →' : 'En savoir plus →'}</span>
              </div>
            </div>

            {/* Problem Detail Dialogs */}
            <ProblemDetailDialog open={problemDialog === 'bagages'} onOpenChange={(o) => setProblemDialog(o ? 'bagages' : null)} type="bagages" lang={lang} />
            <ProblemDetailDialog open={problemDialog === 'personnes'} onOpenChange={(o) => setProblemDialog(o ? 'personnes' : null)} type="personnes" lang={lang} />
            <ProblemDetailDialog open={problemDialog === 'urgences'} onOpenChange={(o) => setProblemDialog(o ? 'urgences' : null)} type="urgences" lang={lang} />
          </div>
        </section>

        {/* ─── PRODUCTS ─── */}
        <section className="hk-section" id="produits">
          <div className="hk-section-header">
            <span className="hk-tag reveal">{t('landing.products.tag')}</span>
            <h2 className="hk-title reveal">{t('landing.products.title')}</h2>
            <p className="hk-subtitle reveal">{t('landing.products.subtitle')}</p>
          </div>

          <div className="hk-products-grid">
            {/* PASS BAGAGE */}
            <div className="hk-product reveal">
              <div className="hk-product-top hk-product-top--bagage">
                <span className="hk-product-top-icon">🧳</span>
                <h3>{t('landing.products.bagageTitle')}</h3>
                <p>{t('landing.products.bagageSub')}</p>
              </div>
              <div className="hk-product-body">
                <p className="hk-product-desc">{t('landing.products.bagageDesc')}</p>
                <div className="hk-how-title">{t('landing.products.howItWorks')}</div>
                <div className="hk-step">
                  <div className="hk-step-num">1</div>
                  <div className="hk-step-text">{t('landing.products.bagageStep1')}</div>
                </div>
                <div className="hk-step">
                  <div className="hk-step-num">2</div>
                  <div className="hk-step-text">{t('landing.products.bagageStep2')}</div>
                </div>
                <div className="hk-step">
                  <div className="hk-step-num">3</div>
                  <div className="hk-step-text">{t('landing.products.bagageStep3')}</div>
                </div>
                <div className="hk-use-case">
                  <h5>{t('landing.products.useCase')}</h5>
                  <p>{t('landing.products.bagageUseCase')}</p>
                </div>
              </div>
              <div className="hk-product-footer">
                <Link href="/select" className="hk-product-btn hk-product-btn--bagage">
                  {t('landing.products.bagageCta')} →
                </Link>
              </div>
            </div>

            {/* PASS IDENTITY */}
            <div className="hk-product reveal">
              <div className="hk-product-top hk-product-top--identity">
                <span className="hk-product-top-icon">👤</span>
                <h3>{t('landing.products.identityTitle')}</h3>
                <p>{t('landing.products.identitySub')}</p>
              </div>
              <div className="hk-product-body">
                <p className="hk-product-desc">{t('landing.products.identityDesc')}</p>
                <div className="hk-how-title">{t('landing.products.howItWorks')}</div>
                <div className="hk-step">
                  <div className="hk-step-num">1</div>
                  <div className="hk-step-text">{t('landing.products.identityStep1')}</div>
                </div>
                <div className="hk-step">
                  <div className="hk-step-num">2</div>
                  <div className="hk-step-text">{t('landing.products.identityStep2')}</div>
                </div>
                <div className="hk-step">
                  <div className="hk-step-num">3</div>
                  <div className="hk-step-text">{t('landing.products.identityStep3')}</div>
                </div>
                <div className="hk-use-case">
                  <h5>{t('landing.products.useCase')}</h5>
                  <p>{t('landing.products.identityUseCase')}</p>
                </div>
              </div>
              <div className="hk-product-footer">
                <Link href="/select" className="hk-product-btn hk-product-btn--identity">
                  {t('landing.products.identityCta')} →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── COMPARISON ─── */}
        <section className="hk-section-alt">
          <div className="hk-section-alt-inner">
            <div className="hk-section-header">
              <span className="hk-tag reveal">{t('landing.comparison.tag')}</span>
              <h2 className="hk-title reveal">{t('landing.comparison.title')}</h2>
            </div>
            <div className="hk-comparison-table reveal">
              <div className="hk-comp-row hk-comp-row--header">
                <div className="hk-comp-cell">{t('landing.comparison.feature')}</div>
                <div className="hk-comp-cell"><div className="hk-comp-product"><span className="hk-comp-product-icon">🧳</span> Pass Bagage</div></div>
                <div className="hk-comp-cell"><div className="hk-comp-product"><span className="hk-comp-product-icon">👤</span> Pass Identity</div></div>
              </div>
              <div className="hk-comp-row">
                <div className="hk-comp-cell" style={{fontWeight:600}}>{t('landing.comparison.forWho')}</div>
                <div className="hk-comp-cell">{t('landing.comparison.bagageFor')}</div>
                <div className="hk-comp-cell">{t('landing.comparison.identityFor')}</div>
              </div>
              <div className="hk-comp-row">
                <div className="hk-comp-cell" style={{fontWeight:600}}>{t('landing.comparison.whatsapp')}</div>
                <div className="hk-comp-cell hk-comp-cell--yes">✓</div>
                <div className="hk-comp-cell hk-comp-cell--yes">✓</div>
              </div>
              <div className="hk-comp-row">
                <div className="hk-comp-cell" style={{fontWeight:600}}>{t('landing.comparison.gps')}</div>
                <div className="hk-comp-cell hk-comp-cell--yes">✓</div>
                <div className="hk-comp-cell hk-comp-cell--yes">✓</div>
              </div>
              <div className="hk-comp-row">
                <div className="hk-comp-cell" style={{fontWeight:600}}>{t('landing.comparison.medical')}</div>
                <div className="hk-comp-cell hk-comp-cell--no">✗</div>
                <div className="hk-comp-cell hk-comp-cell--yes">✓</div>
              </div>
              <div className="hk-comp-row">
                <div className="hk-comp-cell" style={{fontWeight:600}}>{t('landing.comparison.photo')}</div>
                <div className="hk-comp-cell hk-comp-cell--yes">✓</div>
                <div className="hk-comp-cell hk-comp-cell--yes">✓</div>
              </div>
              <div className="hk-comp-row">
                <div className="hk-comp-cell" style={{fontWeight:600}}>{t('landing.comparison.remoteEdit')}</div>
                <div className="hk-comp-cell hk-comp-cell--yes">✓</div>
                <div className="hk-comp-cell hk-comp-cell--yes">✓</div>
              </div>
              <div className="hk-comp-row" style={{background:'linear-gradient(135deg, #f8fafc, #f1f5f9)'}}>
                <div className="hk-comp-cell" style={{fontWeight:800, color:'var(--ink)'}}>{t('landing.comparison.price')}</div>
                <div className="hk-comp-cell" style={{fontWeight:800, color:'var(--navy)', fontSize:'16px'}}>2 500 FCFA</div>
                <div className="hk-comp-cell" style={{fontWeight:800, color:'var(--navy)', fontSize:'16px'}}>5 000 FCFA</div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section className="hk-section" id="comment-ca-marche">
          <div className="hk-section-header">
            <span className="hk-tag reveal">{t('landing.how.tag')}</span>
            <h2 className="hk-title reveal">{t('landing.how.title')}</h2>
            <p className="hk-subtitle reveal">{t('landing.how.subtitle')}</p>
          </div>
          <div className="hk-steps-grid">
            <div className="hk-step-card reveal">
              <div className="hk-step-icon"><Image src="/images/step-activation.png" alt="Activation" width={120} height={120} style={{objectFit:'cover'}} /></div>
              <h3>{t('landing.how.s1Title')}</h3>
              <p>{t('landing.how.s1Desc')}</p>
              <div className="hk-step-connector">→</div>
            </div>
            <div className="hk-step-card reveal">
              <div className="hk-step-icon"><Image src="/images/step-protection.png" alt="Protection" width={120} height={120} style={{objectFit:'cover'}} /></div>
              <h3>{t('landing.how.s2Title')}</h3>
              <p>{t('landing.how.s2Desc')}</p>
              <div className="hk-step-connector">→</div>
            </div>
            <div className="hk-step-card reveal">
              <div className="hk-step-icon"><Image src="/images/step-alert.png" alt="Alerte" width={120} height={120} style={{objectFit:'cover'}} /></div>
              <h3>{t('landing.how.s3Title')}</h3>
              <p>{t('landing.how.s3Desc')}</p>
            </div>
          </div>
        </section>

        {/* ─── TESTIMONIALS ─── */}
        <section className="hk-section-alt">
          <div className="hk-section-alt-inner">
            <div className="hk-section-header">
              <span className="hk-tag reveal">{t('landing.testimonials.tag')}</span>
              <h2 className="hk-title reveal">{t('landing.testimonials.title')}</h2>
            </div>
            <div className="hk-testimonials-grid">
              <div className="hk-testimonial reveal">
                <p className="hk-testimonial-text">{t('landing.testimonials.t1Text')}</p>
                <div className="hk-testimonial-author">
                  <div className="hk-avatar">AF</div>
                  <div className="hk-author-info">
                    <h4>{t('landing.testimonials.t1Name')}</h4>
                    <p>{t('landing.testimonials.t1Info')}</p>
                  </div>
                </div>
              </div>
              <div className="hk-testimonial reveal">
                <p className="hk-testimonial-text">{t('landing.testimonials.t2Text')}</p>
                <div className="hk-testimonial-author">
                  <div className="hk-avatar">FD</div>
                  <div className="hk-author-info">
                    <h4>{t('landing.testimonials.t2Name')}</h4>
                    <p>{t('landing.testimonials.t2Info')}</p>
                  </div>
                </div>
              </div>
              <div className="hk-testimonial reveal">
                <p className="hk-testimonial-text">{t('landing.testimonials.t3Text')}</p>
                <div className="hk-testimonial-author">
                  <div className="hk-avatar">MN</div>
                  <div className="hk-author-info">
                    <h4>{t('landing.testimonials.t3Name')}</h4>
                    <p>{t('landing.testimonials.t3Info')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── AGENCIES CTA ─── */}
        <div style={{ padding: '0 24px' }}>
          <div className="hk-agencies reveal">
            <h2>🏢 {t('landing.agencies.title')}</h2>
            <p>{t('landing.agencies.desc')}</p>
            <Link href="/agencies" className="hk-agencies-btn">
              {t('landing.agencies.cta')} →
            </Link>
          </div>
        </div>

        {/* ─── FOOTER ─── */}
        <footer className="hk-footer">
          <div className="hk-footer-grid">
            {/* Logo & tagline */}
            <div className="hk-footer-col">
              <Image src="/logo.png" alt="PassHajj" width={150} height={58} style={{ objectFit: 'contain', borderRadius: '14px', padding: '5px', background: 'rgba(255,255,255,0.9)', marginBottom: '12px' }} />
              <p style={{ fontSize: '13px', lineHeight: 1.5 }}>{t('landing.footer.tagline')}</p>
            </div>
            {/* Produit */}
            <div className="hk-footer-col">
              <h4>{lang === 'ar' ? 'المنتج' : lang === 'en' ? 'Product' : 'Produit'}</h4>
              <ul>
                <li><a href="#produits">{t('landing.nav.products')}</a></li>
                <li><a href="#comment-ca-marche">{t('landing.nav.howItWorks')}</a></li>
                <li><Link href="/demo">{lang === 'ar' ? 'عرض توضيحي' : lang === 'en' ? 'Demo' : 'Démo'}</Link></li>
              </ul>
            </div>
            {/* Entreprise */}
            <div className="hk-footer-col">
              <h4>{lang === 'ar' ? 'الشركة' : lang === 'en' ? 'Company' : 'Entreprise'}</h4>
              <ul>
                <li><Link href="/contact">{lang === 'ar' ? 'اتصل بنا' : lang === 'en' ? 'Contact' : 'Contact'}</Link></li>
                <li><Link href="/a-propos">{lang === 'ar' ? 'من نحن' : lang === 'en' ? 'About' : 'À propos'}</Link></li>
                <li><Link href="/devenir-partenaire">{lang === 'ar' ? 'شركاء' : lang === 'en' ? 'Partners' : 'Partenaires'}</Link></li>
              </ul>
            </div>
            {/* Légal */}
            <div className="hk-footer-col">
              <h4>{lang === 'ar' ? 'قانوني' : lang === 'en' ? 'Legal' : 'Légal'}</h4>
              <ul>
                <li><Link href="/mentions-legales">{lang === 'ar' ? 'إشعار قانوني' : lang === 'en' ? 'Legal Notice' : 'Mentions légales'}</Link></li>
                <li><Link href="/confidentialite">{lang === 'ar' ? 'سياسة الخصوصية' : lang === 'en' ? 'Privacy Policy' : 'Politique de confidentialité'}</Link></li>
                <li><Link href="/cgu">{lang === 'ar' ? 'شروط الاستخدام' : lang === 'en' ? 'Terms of Use' : 'CGU'}</Link></li>
              </ul>
            </div>
          </div>
          <div className="hk-footer-inner">
            <div className="hk-footer-bottom">
              <p>&copy; 2025 PassHajj. {t('landing.footer.rights')}</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
