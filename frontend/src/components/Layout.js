import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from './Logout';
import '../css/Layout.css';

function Layout({children}) {
  const navigate = useNavigate();

  const handleLogoutClick = async () => {
    const success = await logout();
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <button className="nav-button" onClick={() => navigate('/home')}>Home</button>
        <button className="nav-button logout" onClick={handleLogoutClick}>Logout</button>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;