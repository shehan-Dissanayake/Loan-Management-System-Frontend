import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function AppShell({ children }) {
  const { logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="app-shell">
      {menuOpen && <div className="sidebar-backdrop" onClick={closeMenu} />}
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          Rohana <span>Credit</span>
          <button className="sidebar-close-btn" onClick={closeMenu}>
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')} onClick={closeMenu}>
            <i className="ti ti-layout-dashboard" aria-hidden="true" /> Dashboard
          </NavLink>
          <NavLink to="/customers" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')} onClick={closeMenu}>
            <i className="ti ti-building-store" aria-hidden="true" /> Customers
          </NavLink>
          <NavLink to="/loans" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')} onClick={closeMenu}>
            <i className="ti ti-cash" aria-hidden="true" /> Loans
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')} onClick={closeMenu}>
            <i className="ti ti-chart-bar" aria-hidden="true" /> Reports
          </NavLink>
          <NavLink to="/holidays" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')} onClick={closeMenu}>
            <i className="ti ti-calendar-off" aria-hidden="true" /> Holidays
          </NavLink>
          <NavLink to="/assistant" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')} onClick={closeMenu}>
            <i className="ti ti-robot" aria-hidden="true" /> Assistant
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-link btn-ghost" style={{ width: '100%' }} onClick={() => { closeMenu(); handleLogout(); }}>
            <i className="ti ti-logout" aria-hidden="true" /> Log out
          </button>
        </div>
      </aside>

      <div className="main-content">
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="menu-toggle-btn" onClick={() => setMenuOpen(true)}>
              <i className="ti ti-menu-2" aria-hidden="true" />
            </button>
            <div>
              <div className="topbar-title">Rohana Credit</div>
              <div className="topbar-sub">{today}</div>
            </div>
          </div>
          <div className="topbar-right">
            <button className="theme-btn" onClick={toggle}>
              <i className={`ti ti-${dark ? 'sun' : 'moon'}`} aria-hidden="true" />
              {dark ? 'Light' : 'Dark'}
            </button>
            <div className="avatar">RC</div>
          </div>
        </div>
        <div className="page-body">{children}</div>
      </div>
    </div>
  );
}