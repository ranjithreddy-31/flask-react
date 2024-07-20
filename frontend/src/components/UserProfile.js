import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { isTokenExpired, getUserProfile, showFeeds, deletePost, updateFeed, getCurrentUser } from './Utils';
import Layout from './Layout';
import '../css/Feed.css';

function UserProfile() {
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const [openComments, setOpenComments] = useState({});
    const [comments, setComments] = useState({});
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [openMenus, setOpenMenus] = useState({});
    const [editingPost, setEditingPost] = useState(null);
    const [editHeading, setEditHeading] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editPhoto, setEditPhoto] = useState(null);
    const [editPhotoPreview, setEditPhotoPreview] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const { username } = useParams();
    const navigate = useNavigate();
    const groupCode = localStorage.getItem("currentGroup");

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const userData = await getUserProfile(username, groupCode);
                setUser(userData.user);
            } catch (err) {
                setError(err.message);
                if (err.message === 'Token expired') {
                    navigate('/login');
                }
            }
        };
        const fetchCurrentUser = async () => {
            const user = await getCurrentUser();
            setCurrentUser(user);
        };
        fetchCurrentUser();
        fetchUserProfile();
    }, [username, refreshTrigger, navigate, groupCode]);

    const handleUserClick = (createdBy) => {
        navigate(`/profile/${createdBy}`);
    };

    const handleCommentChange = (postId, value) => {
        setComments((prevComments) => ({
            ...prevComments,
            [postId]: value,
        }));
    };

    const handleAddComment = async(feedId) => {
        try {
            const token = localStorage.getItem('token');
            if(isTokenExpired(token)) {
                navigate('/login');
                return;
            }
            await axios.post('http://127.0.0.1:5000/addComment', {
                feed_id: feedId,
                comment: comments[feedId]
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            setComments(prev => ({...prev, [feedId]: ''}));
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error('Error adding comment:', error);
            if (error.response && error.response.status === 401) {
                navigate('/login');
            }
        }
    };

    const handleEditPost = (postId, heading, content, photo) => {
        setEditingPost(postId);
        setEditHeading(heading);
        setEditContent(content);
        setEditPhoto(photo);
        setEditPhotoPreview(photo ? `http://127.0.0.1:5000/uploads/${photo}` : null);
    };

    const handlePhotoChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setEditPhoto(file);
            const previewURL = URL.createObjectURL(file);
            setEditPhotoPreview(previewURL);
        }
    };    

    const handleUpdatePost = async (postId) => {
        try {
            const token = localStorage.getItem('token');
            if(isTokenExpired(token)) {
                navigate('/login');
                return;
            }
            const formData = new FormData();
            formData.append('heading', editHeading);
            formData.append('content', editContent);
            if (editPhoto instanceof File) {
                formData.append('photo', editPhoto);
            } else if (editPhoto) {
                formData.append('photo', editPhoto);
            }
            await updateFeed(postId, formData, token);
            setEditingPost(null);
            setEditHeading('');
            setEditContent('');
            setEditPhoto(null);
            setEditPhotoPreview(null);
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error('Error updating post:', error);
            if (error.response && error.response.status === 401) {
                navigate('/login');
            }
        }
    };

    const handleDeletePost = async(postId) => {
        const token = localStorage.getItem('token');
        if(isTokenExpired(token)){
            navigate('/');
        }
        await deletePost(postId, token);
        setRefreshTrigger(prev => prev+1);
    };

    if (error) return <div className="alert alert-danger">Error: {error}</div>;
    if (!user) return <div className="alert alert-info">Loading...</div>;

    return (
        <Layout>
            <div className="user-profile">
                <div className="profile-header">
                    <h1>{username}'s Profile</h1>
                    <p>User ID: {user.id}</p>
                    <p>Email: {user.email}</p>
                </div>

                <div className="feeds-section">
                    <h2>Feeds</h2>
                    {user.feeds && user.feeds.length > 0 ? (
                        showFeeds(
                            user.feeds,
                            true, // isAuthorized
                            openComments,
                            setOpenComments,
                            comments,
                            handleCommentChange,
                            handleAddComment,
                            handleUserClick,
                            1, // currentPage (not applicable for profile view)
                            1, // totalPages (not applicable for profile view)
                            () => {}, // handlePrevPage (not applicable for profile view)
                            () => {}, // handleNextPage (not applicable for profile view)
                            handleEditPost,
                            handleDeletePost,
                            currentUser, // currentUser
                            openMenus,
                            setOpenMenus,
                            editingPost,
                            editHeading,
                            setEditHeading,
                            editContent,
                            setEditContent,
                            handleUpdatePost,
                            handlePhotoChange,
                            editPhotoPreview,
                            groupCode
                        )
                    ) : (
                        <p className="alert alert-info">No feeds available.</p>
                    )}
                </div>
            </div>
        </Layout>
    );
}

export default UserProfile;
