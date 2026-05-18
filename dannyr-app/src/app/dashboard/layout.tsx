'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import './dashboard.css';

import { playHoverSound, playClickSound } from '@/lib/utils/sfx';

const NAV_ITEMS = [
  { href: '/dashboard/finanzas', label: 'Finanzas', icon: 'dollar-sign', section: 'operaciones' },
  { href: '/dashboard/bales', label: 'Fardos (Live)', icon: 'box', section: 'operaciones' },
  { href: '/dashboard/lives', label: 'Ventas de Live', icon: 'shopping-bag', section: 'operaciones' },
  { href: '/dashboard/history/bales', label: 'Historial Fardos', icon: 'box', section: 'historial' },
];

function NavIcon({ icon }: { icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    'package': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4l-9-5.19"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    'shopping-bag': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
    'truck': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    'clock': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    'archive': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>,
    'box': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    'dollar-sign': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  };
  return <>{icons[icon]}</>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const router = useRouter();
  const supabase = createBrowserClient();

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => { closeSidebar(); }, [pathname, closeSidebar]);

  const handleLogout = async () => {
    playClickSound();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const operaciones = NAV_ITEMS.filter(i => i.section === 'operaciones');
  const historial = NAV_ITEMS.filter(i => i.section === 'historial');

  return (
    <div className="dashboard-layout" style={{ display: 'flex', minHeight: '100vh', background: 'radial-gradient(circle at top right, #1d0f35, #06040a 75%)' }}>
      <div className={`mobile-overlay ${sidebarOpen ? 'open' : ''}`} onClick={closeSidebar} />
      
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{
        width: 'var(--sidebar-width)',
        background: 'var(--bg-secondary)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div className="sidebar-brand" style={{ padding: '32px 24px', borderBottom: '1px solid var(--border)' }}>
          <Link href="/dashboard/finanzas" style={{ textDecoration: 'none' }} onClick={playClickSound}>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: '800', 
              letterSpacing: '-1.5px',
              background: 'linear-gradient(135deg, #d4af37 0%, #ff7eb6 50%, #a855f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>ANDCLAU</h1>
          </Link>
          <span style={{ 
            fontSize: '9px', 
            textTransform: 'uppercase', 
            letterSpacing: '0.25em', 
            color: 'var(--text-muted)',
            fontWeight: '700'
          }}>Accessible Luxury</span>
        </div>

        <nav className="sidebar-nav" style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="sidebar-section" style={{
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: 'var(--warning)',
            padding: '0 12px',
            marginBottom: '8px'
          }}>Operaciones</div>
          
          {operaciones.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`nav-link ${isActive ? 'active' : ''}`}
                onMouseEnter={playHoverSound}
                onClick={playClickSound}
              >
                <NavIcon icon={item.icon} />
                {item.label}
              </Link>
            );
          })}
          
          <div className="sidebar-section" style={{
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: 'var(--warning)',
            padding: '0 12px',
            marginTop: '24px',
            marginBottom: '8px'
          }}>Historial</div>
          
          {historial.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`nav-link ${isActive ? 'active' : ''}`}
                onMouseEnter={playHoverSound}
                onClick={playClickSound}
              >
                <NavIcon icon={item.icon} />
                {item.label}
              </Link>
            );
          })}
          
          <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
            <button 
              onClick={handleLogout} 
              onMouseEnter={playHoverSound}
              className="nav-link" 
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                color: 'var(--danger)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontFamily: 'inherit',
                fontSize: 'inherit'
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Cerrar Sesión
            </button>
          </div>
        </nav>
      </aside>

      <main className="dashboard-main" style={{
        flex: 1,
        marginLeft: 'var(--sidebar-width)',
        padding: '32px 24px',
        minHeight: '100vh',
        animation: 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}>
        {children}
      </main>

      <button 
        className="mobile-toggle" 
        onClick={() => {
          playClickSound();
          setSidebarOpen(!sidebarOpen);
        }} 
        aria-label="Toggle menu"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>
    </div>
  );
}
