import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { isTokenExpired, getUserProfile } from './Utils';
import Layout from './Layout';
import Comments from './Comments'; // Make sure to import the Comments component if it exists
import '../css/Feed.css'

function UserProfile() {
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const [openComments, setOpenComments] = useState({});
    const [comments, setComments] = useState({});
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const { username } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const userData = await getUserProfile(username);
                setUser(userData.user);
            } catch (err) {
                setError(err.message);
                if (err.message === 'Token expired') {
                    navigate('/login');
                }
            }
        };

        fetchUserProfile();
    }, [username, refreshTrigger, navigate]);

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
        }
    };

    if (error) return <div>Error: {error}</div>;
    if (!user) return <div>Loading...</div>;

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
                        user.feeds.map((post) => (
                            <div key={post.id} className="feed-item">
                                <h3 className="post-heading">{post.heading}</h3>
                                <p className="post-content">{post.content}</p>
                                {post.picture && (
                                    <div className="post-image-container">
                                        <img
                                            src={`http://127.0.0.1:5000/uploads/${post.picture}`}
                                            alt="Post"
                                            className="post-image"
                                        />
                                    </div>
                                )}
                                <p className="post-meta">
                                    By:{' '}
                                    <button
                                        onClick={() => handleUserClick(post.created_by)}
                                        className="user-link"
                                    >
                                        {post.created_by}
                                    </button>{' '}
                                    at {new Date(post.created_at).toLocaleString()}
                                </p>
                                <button
                                    onClick={() =>
                                        setOpenComments((prevState) => ({
                                            ...prevState,
                                            [post.id]: !prevState[post.id],
                                        }))
                                    }
                                    className="show-comments-toggle-link"
                                >
                                    {openComments[post.id] ? 'Hide Comments' : 'Show Comments'}
                                </button>
                                {openComments[post.id] && <Comments comments={post.comments} />}
                                <div className="comment-section">
                                    <textarea
                                        value={comments[post.id] || ''}
                                        onChange={(e) => handleCommentChange(post.id, e.target.value)}
                                        placeholder="Add a comment..."
                                        className="comment-input"
                                    />
                                    <button
                                        onClick={() => handleAddComment(post.id)}
                                        className="comment-button"
                                    >
                                        Add Comment
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No feeds available.</p>
                    )}
                </div>
            </div>
        </Layout>
    );
}

export default UserProfile;
