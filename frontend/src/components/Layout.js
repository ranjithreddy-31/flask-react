import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from './Logout';
import { getCurrentUser } from './Utils';

import '../css/Layout.css';
import '../css/AddFeed.css';
import '../css/Common.css';
import '../css/Feed.css';
import '../css/Weather.css';

function Layout({ children }) {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogoutClick = async () => {
    const success = await logout();
    if (success) {
      navigate('/');
    }
  };

  const getUserProfile = async () => {
      const username = getCurrentUser();
      navigate(`/profile/${username}`);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setIsDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', closeDropdown);
    return () => {
      document.removeEventListener('mousedown', closeDropdown);
    };
  }, []);

  return (
    <div className="layout">
      <nav className="navbar">
        <button className="nav-button" onClick={() => navigate('/home')}>Home</button>
        <div className="dropdown" ref={dropdownRef}>
          <button className="nav-button dropdown-toggle" onClick={toggleDropdown}>
            Account
          </button>
          {isDropdownOpen && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={getUserProfile}>Profile</button>
              <button className="dropdown-item" onClick={handleLogoutClick}>Logout</button>
            </div>
          )}
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;
