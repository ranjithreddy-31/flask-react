import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { isTokenExpired } from './Utils';
import '../css/FeedHome.css';

function FeedHome() {
    const navigate = useNavigate();
    const [groupName, setGroupName] = useState('');
    const [groupCode, setGroupCode] = useState('');
    const [newGroupCode, setNewGroupCode] = useState('');
    const [aboutGroup, setAboutGroup] = useState('');
    const [error, setError] = useState('');

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const token = localStorage.getItem('token');
            if (isTokenExpired(token)) {
                navigate('/login');
                return;
            }
            const response = await axios.post("http://127.0.0.1:5000/createGroup", {
                groupName,
                aboutGroup
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setNewGroupCode(response.data.newGroupCode);
        } catch (error) {
            console.error(`Failed creating group with error:`, error);
            setError('Failed to create group. Please try again.');
        }
    }

    const handleJoinGroup = async (e) => {
        e.preventDefault();
        if (!groupCode) {
            setError('Please enter a group code.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (isTokenExpired(token)) {
                navigate('/login');
                return;
            }
            const response = await axios.get(`http://127.0.0.1:5000/isGroupInDB`, {
                params: { groupCode },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                navigate(`/feed`, { state: { groupCode } });
            } else {
                setError('Group not found.');
            }
        } catch (error) {
            console.error(`Error checking group:`, error);
            setError('Failed to check group. Please try again.');
        }
    }

    return (
        <div className="feed-home-container">
            <h1 className="feed-home-title">Feed Home</h1>
            <div className="feed-home-content">
                <div className="feed-home-pane">
                    <h2 className="feed-home-subtitle">Join a Group</h2>
                    {error && <p className="feed-home-error">{error}</p>}
                    <form onSubmit={handleJoinGroup}>
                        <div className="feed-home-input-group">
                            <label htmlFor="groupCode">Group Code</label>
                            <input 
                                id="groupCode"
                                type='text' 
                                value={groupCode} 
                                onChange={(e) => setGroupCode(e.target.value)} 
                                placeholder='Enter the Group Code'
                                className="feed-home-input"
                                required
                            />
                        </div>
                        <button type="submit" className="feed-home-button">Join</button>
                    </form>
                </div>
                <div className="feed-home-pane">
                    <h2 className="feed-home-subtitle">Create a Group</h2>
                    <form onSubmit={handleCreateGroup}>
                        <div className="feed-home-input-group">
                            <label htmlFor="groupName">Group Name</label>
                            <input 
                                id="groupName"
                                type='text' 
                                value={groupName} 
                                onChange={(e) => setGroupName(e.target.value)} 
                                placeholder='Enter the Group Name'
                                className="feed-home-input"
                                required
                            />
                        </div>
                        <div className="feed-home-input-group">
                            <label htmlFor="aboutGroup">About Group</label>
                            <textarea 
                                id="aboutGroup"
                                value={aboutGroup} 
                                onChange={(e) => setAboutGroup(e.target.value)} 
                                placeholder='About this Group...'
                                className="feed-home-textarea"
                                required
                            />
                        </div>
                        <button type="submit" className="feed-home-button">Create</button>
                        {newGroupCode && <p className="feed-home-message">Your Group Code is: <strong>{newGroupCode}</strong></p>}
                    </form>
                    
                </div>
            </div>
        </div>
    )
}

export default FeedHome;
