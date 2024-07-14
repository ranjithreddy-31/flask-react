import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from './Logout';
import { isTokenExpired } from './Utils';
import axios from 'axios';

import '../css/Layout.css';
import '../css/AddFeed.css';
import '../css/Common.css';
import '../css/Feed.css';
import '../css/Weather.css';

function Layout({ children }) {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogoutClick = async () => {
    const success = await logout();
    if (success) {
      navigate('/');
    }
  };

  const getUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token || isTokenExpired(token)) {
        navigate('/');
        return;
      }

      const response = await axios.get(
        'http://127.0.0.1:5000/getCurrentUser',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const username = response.data.username;
      navigate(`/profile/${username}`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('Token is invalid or expired. Redirecting to login.');
        navigate('/');
      } else {
        console.log(`Error occurred while fetching user profile: ${error}`);
      }
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <button className="nav-button" onClick={() => navigate('/home')}>Home</button>
        <div className="dropdown">
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