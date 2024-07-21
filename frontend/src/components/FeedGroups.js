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
    const [activeForm, setActiveForm] = useState(null); // 'join', 'create', or null

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
                headers: { Authorization: `Bearer ${token}` }
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
            const response = await axios.post("http://127.0.0.1:5000/createGroup", 
                { groupName, aboutGroup },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNewGroupCode(response.data.newGroupCode);
            fetchUserGroups();
            setActiveForm(null); // Close the form after successful creation
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
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.status === 200) {
                localStorage.setItem('currentGroup', groupCode);
                fetchUserGroups();
                setActiveForm(null); // Close the form after successful join
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
        setActiveForm(activeForm === 'join' ? null : 'join');
    };

    const toggleCreateForm = () => {
        setActiveForm(activeForm === 'create' ? null : 'create');
    };

    return (
        <div className="feed-groups-container">
            <h2 className="feed-groups-title">Your Groups</h2>
            <div className="feed-groups-actions">
                <button 
                    onClick={toggleJoinForm} 
                    className={`feed-groups-button ${activeForm === 'join' ? 'active' : ''}`}
                >
                    Join Group
                </button>
                <button 
                    onClick={toggleCreateForm} 
                    className={`feed-groups-button ${activeForm === 'create' ? 'active' : ''}`}
                >
                    Create Group
                </button>
            </div>
            
            {activeForm === 'join' && (
                <form onSubmit={handleJoinGroup} className="feed-groups-form">
                    <input 
                        type="text" 
                        placeholder="Enter group code"
                        value={groupCode}
                        onChange={(e) => setGroupCode(e.target.value)}
                        className="feed-groups-input"
                    />
                    <button type="submit" className="feed-groups-submit">Join</button>
                </form>
            )}

            {activeForm === 'create' && (
                <form onSubmit={handleCreateGroup} className="feed-groups-form">
                    <input 
                        type="text" 
                        placeholder="Group name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="feed-groups-input"
                    />
                    <textarea 
                        placeholder="About the group"
                        value={aboutGroup}
                        onChange={(e) => setAboutGroup(e.target.value)}
                        className="feed-groups-textarea"
                    ></textarea>
                    <button type="submit" className="feed-groups-submit">Create</button>
                </form>
            )}

            {error && <p className="feed-groups-error">{error}</p>}
            
            {newGroupCode && (
                <p className="feed-groups-message">New group created! Group code: {newGroupCode}</p>
            )}

            <div className="feed-groups-list">
                {userGroups.length > 0 ? (
                    userGroups.map((group) => (
                        <Link to={`/feed/${group.code}`} key={group.code} className="feed-group-item">
                            <div className="feed-group-avatar">{getGroupInitials(group.name)}</div>
                            <div className="feed-group-info">
                                <h3>{group.name}</h3>
                                <p>{group.code}</p>
                            </div>
                        </Link>
                    ))
                ) : (
                    <p className="feed-groups-empty">You haven't joined any groups yet.</p>
                )}
            </div>
        </div>
    );
}

export default FeedGroups;