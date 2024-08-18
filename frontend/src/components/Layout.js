import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from './Logout';
import { getCurrentUser } from './Utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

import '../css/Layout.css';
import '../css/AddFeed.css';
import '../css/Common.css';
import '../css/Feed.css';
import '../css/Weather.css';

function Layout({ children }) {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [currentUser, setCurrentUser] = useState();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    const fetchUserName = async () => {
      const username = await getCurrentUser();
      setCurrentUser(username);
    };
    fetchUserName();
  }, []);

  const handleLogoutClick = async () => {
    const success = await logout();
    if (success) {
      navigate('/');
    }
  };

  const getUserProfile = async () => {
    const username = await getCurrentUser();
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

  const handleDarkMode = () => {
    setDarkMode((prevMode) => {
      const newMode = !prevMode;
      localStorage.setItem('darkMode', newMode);
      return newMode;
    });
  };

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  return (
    <div className={`layout ${darkMode ? 'dark-mode' : ''}`}>
      <nav className="navbar">
        <button className="nav-button" onClick={() => navigate('/home')}>Home</button>
        <div className="dropdown" ref={dropdownRef}>
          <button className="nav-button dropdown-toggle" onClick={toggleDropdown}>
            {currentUser}
          </button>
          {isDropdownOpen && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={getUserProfile}>Profile</button>
              <button className="dropdown-item" onClick={handleLogoutClick}>Logout</button>
              <div className="dropdown-item">
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={darkMode} 
                    onChange={handleDarkMode} 
                  />
                  <span className="slider"></span>
                </label>
                <FontAwesomeIcon icon={darkMode ? faMoon : faSun} />
              </div>
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