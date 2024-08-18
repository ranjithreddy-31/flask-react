import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { isTokenExpired } from './Utils'; 
import '../css/AboutGroup.css';
import Chat from './Chat';
import config from '../config';

function AboutGroup() {
  const { groupCode } = useParams();
  const [groupInfo, setGroupInfo] = useState(null);
  const [error, setError] = useState('');
  const [darkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const navigate = useNavigate();

  const fetchGroupData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (isTokenExpired(token)) {
        navigate('/login');
        return;
      }
      
      const response = await axios.get(`${config.API_URL}/about/${groupCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setGroupInfo(response.data.group);
    } catch (error) {
      console.error('Error fetching group data:', error);
      setError('Failed to fetch group information. Please try again.');
    }
  }, [groupCode, navigate]);

  useEffect(() => {
    fetchGroupData();
  }, [groupCode, fetchGroupData]);

  const handleUserClick = (username) => {
    navigate(`/profile/${username}`, { state: { groupCode } });
  };

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!groupInfo) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className={`about-group-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="about-group-content">
        <div className="about-group">
          <h1>{groupInfo.name}</h1>
          <span className="group-meta">
            Created by{' '}
            <button onClick={() => handleUserClick(groupInfo.created_by)} className="user-link">
              {groupInfo.created_by}
            </button>{' '}
            on {new Date(groupInfo.created_at).toLocaleDateString()}
          </span>
          <p><strong>Group Code:</strong> {groupInfo.code}</p>
          <p><strong>Description:</strong> {groupInfo.description}</p>
        </div>
        <div className="group-members">
          <h2>Members</h2>
          <ul>
            {groupInfo.members.map((member) => (
              <li key={member.id}>
                <button onClick={() => handleUserClick(member.username)} className="user-link">
                  {member.username}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="chat-section">
        {!error && <Chat groupCode={groupCode} />}
      </div>
    </div>
  );
}

export default AboutGroup;