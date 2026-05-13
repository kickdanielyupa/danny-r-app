'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import './dashboard.css';

const NAV_ITEMS = [
  { href: '/dashboard/inventory', label: 'Inventario', icon: 'package', section: 'operaciones' },
  { href: '/dashboard/orders', label: 'Pedidos', icon: 'shopping-bag', section: 'operaciones' },
  { href: '/dashboard/shipments', label: 'Envíos', icon: 'truck', section: 'operaciones' },
  { href: '/dashboard/history/orders', label: 'Historial Pedidos', icon: 'clock', section: 'historial' },
  { href: '/dashboard/history/shipments', label: 'Historial Envíos', icon: 'archive', section: 'historial' },
];

function NavIcon({ icon }: { icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    'package': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4l-9-5.19"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    'shopping-bag': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
    'truck': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    'clock': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    'archive': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>,
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
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const operaciones = NAV_ITEMS.filter(i => i.section === 'operaciones');
  const historial = NAV_ITEMS.filter(i => i.section === 'historial');

  return (
    <div className="dashboard-layout">
      <div className={`mobile-overlay ${sidebarOpen ? 'open' : ''}`} onClick={closeSidebar} />
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{display: 'flex', flexDirection: 'column'}}>
        <div className="sidebar-brand">
          <h1>DannyR</h1>
          <span>Live Selling OS</span>
        </div>
        <nav className="sidebar-nav" style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
          <div className="sidebar-section">Operaciones</div>
          {operaciones.map(item => (
            <Link key={item.href} href={item.href} className={`nav-link ${pathname === item.href ? 'active' : ''}`}>
              <NavIcon icon={item.icon} />
              {item.label}
            </Link>
          ))}
          <div className="sidebar-section">Historial</div>
          {historial.map(item => (
            <Link key={item.href} href={item.href} className={`nav-link ${pathname === item.href ? 'active' : ''}`}>
              <NavIcon icon={item.icon} />
              {item.label}
            </Link>
          ))}
          
          <div style={{marginTop: 'auto', paddingTop: 20}}>
            <button onClick={handleLogout} className="nav-link" style={{width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit', fontSize: 'inherit'}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 18, height: 18}}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Cerrar Sesión
            </button>
          </div>
        </nav>
      </aside>
      <main className="dashboard-main">{children}</main>
      <button className="mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
        {sidebarOpen ? '✕' : '☰'}
      </button>
    </div>
  );
}
