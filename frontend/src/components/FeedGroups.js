import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { isTokenExpired } from './Utils';
import '../css/FeedGroups.css';

function FeedGroups() {
    const navigate = useNavigate();
    const [groupName, setGroupName] = useState('');
    const [groupCode, setGroupCode] = useState('');
    const [newGroupCode, setNewGroupCode] = useState('');
    const [aboutGroup, setAboutGroup] = useState('');
    const [error, setError] = useState('');
    const [userGroups, setUserGroups] = useState([]);
    const [showJoinForm, setShowJoinForm] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);

    useEffect(() => {
        fetchUserGroups();
    }, []);

    const fetchUserGroups = async () => {
        setError('');
        try {
            const token = localStorage.getItem('token');
            if (isTokenExpired(token)) {
                navigate('/login');
                return;
            }
            const response = await axios.get(`http://127.0.0.1:5000/user/groups`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setUserGroups(response.data.groups);
        } catch (error) {
            console.error(`Failed fetching user groups with error:`, error);
            setError('Failed to fetch user groups. Please try again.');
        }
    };

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
            fetchUserGroups();  // Refresh the user's groups after creating a new one
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
            const response = await axios.post(`http://127.0.0.1:5000/joinGroup`, 
                { groupCode },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.status === 200) {
                localStorage.setItem('currentGroup', groupCode);
                fetchUserGroups();  // Refresh the user's groups after joining a new one
                navigate(`/feed/${groupCode}`);
            }
        } catch (error) {
            console.error(`Error joining group:`, error);
            setError(error.response?.data?.message || 'Failed to join group. Please try again.');
        }
    }

    const getGroupInitials = (name) => {
        return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    };

    const toggleJoinForm = () => {
        setShowJoinForm(!showJoinForm);
        if (!showJoinForm) {
            setShowCreateForm(false);
        }
    };

    const toggleCreateForm = () => {
        setShowCreateForm(!showCreateForm);
        if (!showCreateForm) {
            setShowJoinForm(false);
        }
    };

    return (
        <div>
            <h1 className="feed-home-title">Groups</h1>
        <div className="feed-home-container">
            <div className="user-groups">
                    <h2>Your Groups</h2>
                    {userGroups.length > 0 ? (
                        <ul className="group-list">
                            {userGroups.map(group => (
                                <li key={group.id} className="group-item">
                                    <Link to={`/feed/${group.code}`} className="group-link">
                                        <div className="group-avatar">{getGroupInitials(group.name)}</div>
                                        <div className="group-info">
                                            <h3>{group.name}</h3>
                                            <p>{group.code}</p>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>You haven't joined any groups yet.</p>
                    )}
                </div>

            <div className="feed-home-content">
                <div className="feed-home-actions">
                    <button className="feed-home-button" onClick={toggleJoinForm}>
                        {showJoinForm ? 'Hide Join Form' : 'Join a Group'}
                    </button>
                    <button className="feed-home-button" onClick={toggleCreateForm}>
                        {showCreateForm ? 'Hide Create Form' : 'Create a Group'}
                    </button>
                </div>

                {error && <p className="feed-home-error">{error}</p>}

                {showJoinForm && (
                    <div className="feed-home-form">
                        <h2 className="feed-home-subtitle">Join a Group</h2>
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
                )}

                {showCreateForm && (
                    <div className="feed-home-form">
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
                )}
            </div>
        </div>
        </div>
    )
}

export default FeedGroups;
