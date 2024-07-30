import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { getCurrentUser, isTokenExpired } from './Utils';
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
    const [openMenus, setOpenMenus] = useState({});
    const [currentUser, setCurrentUser] = useState();
    const [editingGroup, setEditingGroup] = useState(null);
    const [editGroupName, setEditGroupName] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const socketRef = useRef();
    const menuRef = useRef();

    const fetchUserGroups = useCallback(async () => {
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
    }, [navigate]);

    const fetchCurrentUser = async () => {
        setCurrentUser(await getCurrentUser());
    };

    useEffect(() =>{
        socketRef.current = io('http://127.0.0.1:5000');

        socketRef.current.on('connect', () => {
            console.log('Socket connected in FeedGroups');
        });


        socketRef.current.on('delete_group', ({ groupCode }) => {
            console.log('Deleted')
            setUserGroups((prevGroups) => prevGroups.filter(group => group.code !== groupCode));
        });

        socketRef.current.on('update_group', (updatedGroup) => {
            setUserGroups((prevGroups) => prevGroups.map(group => 
                group.code === updatedGroup.code ? updatedGroup : group
            ));
            
        });
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [])

    useEffect(() => {
        fetchUserGroups();
        fetchCurrentUser();
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenus({});
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            document.removeEventListener('mousedown', handleClickOutside);
        };

    }, [fetchUserGroups, refreshTrigger]);

    const joinGroupRoom = (groupCode) => {
        console.log(`Joining room ${groupCode}`)
        socketRef.current.emit('join', { groupCode });
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
    };

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
                joinGroupRoom(groupCode); // Join the socket room
                navigate(`/feed/${groupCode}`);
            }
        } catch (error) {
            console.error(`Error joining group:`, error);
            setError(error.response?.data?.message || 'Failed to join group. Please try again.');
        }
    };

    const getGroupInitials = (name) => {
        return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    };

    const toggleJoinForm = () => {
        setActiveForm(activeForm === 'join' ? null : 'join');
    };

    const toggleCreateForm = () => {
        setActiveForm(activeForm === 'create' ? null : 'create');
    };

    const toggleMenu = (event, groupCode) => {
        event.preventDefault();
        setOpenMenus(prevState => ({
            ...prevState,
            [groupCode]: !prevState[groupCode]
        }));
    };

    const handleEditGroup = (groupCode, groupName) => {
        setEditingGroup(groupCode);
        setEditGroupName(groupName);
        toggleMenu(groupCode);
    };

    const handleDeleteGroup = async (groupCode) => {
        try {
            const token = localStorage.getItem('token');
            if (isTokenExpired(token)) {
                navigate('/login');
                return;
            }
            await axios.delete(`http://127.0.0.1:5000/group/${groupCode}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // The backend will emit the 'delete_group' event
        } catch (error) {
            console.error('Error deleting group:', error);
            setError('Failed to delete group. Please try again.');
        }
    };

    const handleLeaveGroup = async (groupCode) => {
        try {
            const token = localStorage.getItem('token');
            if (isTokenExpired(token)) {
                navigate('/login');
                return;
            }
            await axios.post(`http://127.0.0.1:5000/leaveGroup`, 
                { groupCode },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUserGroups(prevGroups => prevGroups.filter(group => group.code !== groupCode));
        } catch (error) {
            console.error('Error leaving group:', error);
            setError('Failed to leave group. Please try again.');
        }
    };

    const handleUpdateGroup = async (groupCode) => {
        try {
            const token = localStorage.getItem('token');
            if (isTokenExpired(token)) {
                navigate('/login');
                return;
            }
            await axios.put(`http://127.0.0.1:5000/group/${groupCode}`, 
                { groupName: editGroupName },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setEditingGroup(null);
            setEditGroupName('');
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error('Error updating group:', error);
            setError('Failed to update group. Please try again.');
        }
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
                        <div key={group.code} className="feed-group-item" onClick={() => joinGroupRoom(group.code)}>
                            {editingGroup === group.code ? (
                                <form className="edit-post-form" onSubmit={(e) => {
                                    e.preventDefault();
                                    handleUpdateGroup(group.code);
                                }}>
                                    <input
                                        type="text"
                                        value={editGroupName}
                                        onChange={(e) => setEditGroupName(e.target.value)}
                                        className="edit-heading-input"
                                        placeholder="Edit Group Name"
                                    />
                                    <div className="buttons-group">
                                        <button type="submit" className="post-button action-button">
                                            Update
                                        </button>
                                        <button type="button" onClick={() => setEditingGroup(null)} className="cancel-button action-button">
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <Link to={`/feed/${group.code}`} className="feed-group-link">
                                    <div className="feed-group-avatar">{getGroupInitials(group.name)}</div>
                                    <div className="feed-group-info">
                                        <h3>{group.name}</h3>
                                        <p>{group.code}</p>
                                    </div>
                                </Link>
                            )}
                            <div className="group-menu" ref={menuRef}>
                                <button onClick={(event) => toggleMenu(event, group.code)} className="menu-toggle">
                                    ⋮
                                </button>
                                {openMenus[group.code] && (
                                    <div className="menu-dropdown">
                                        <button 
                                            onClick={() => handleEditGroup(group.code, group.name)} 
                                            disabled={currentUser !== group.created_by}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteGroup(group.code)} 
                                            disabled={currentUser !== group.created_by}
                                        >
                                            Delete
                                        </button>
                                        <button 
                                            onClick={() => handleLeaveGroup(group.code)} 
                                        >
                                            Leave
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="feed-groups-empty">You haven't joined any groups yet.</p>
                )}
            </div>
        </div>
    );
}

export default FeedGroups;