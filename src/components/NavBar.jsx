import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function NavBar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <span className="navbar-brand">BK Credit</span>
      <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>Customers</NavLink>
      <NavLink to="/loans" className={({ isActive }) => (isActive ? 'active' : '')}>Loans</NavLink>
      <NavLink to="/reports" className={({ isActive }) => (isActive ? 'active' : '')}>Reports</NavLink>
      <button onClick={handleLogout} className="logout-btn">Log out</button>
    </nav>
  );
}

export default NavBar;