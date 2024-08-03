import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { isTokenExpired } from './Utils'; 
import '../css/AboutGroup.css';

function AboutGroup() {
  const { groupCode } = useParams();
  const [groupInfo, setGroupInfo] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchGroupData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (isTokenExpired(token)) {
        navigate('/login');
        return;
      }
      
      const response = await axios.get(`http://127.0.0.1:5000/about/${groupCode}`, {
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

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!groupInfo) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="about-group-container">
      <div className="about-group">
        <h1>{groupInfo.name}</h1>
        <p>Group Code: {groupInfo.code}</p>
        <p>Description: {groupInfo.description}</p>
        <p>Created by: {groupInfo.created_by}</p>
        <h2>Members:</h2>
        <ul>
          {groupInfo.members.map((member) => (
            <li key={member.id}>{member.username}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default AboutGroup;
