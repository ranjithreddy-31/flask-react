import axios from 'axios';
import io from 'socket.io-client';
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import config from '../config';
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
    const location = useLocation();
    const [groupCode, setGroupCode] = useState(location.state?.groupCode || null);
    const [posts, setPosts] = useState([]);
    const socketRef = useRef();

    const [darkMode] = useState(() => {
        return localStorage.getItem('darkMode') === 'true';
      });

    useEffect(()=>{
        socketRef.current = io(`${config.API_URL}`);

        socketRef.current.on('connect', () => {
            console.log('Socket connected in User Profile');
            socketRef.current.emit('join', { groupCode });
        });

        socketRef.current.on('connect_error', (error) => {
            console.error('Socket connection error in User Profile:', error);
        });

        socketRef.current.on('new_feed', (feed) => {
            setPosts((prevPosts) => [feed, ...prevPosts]);
        });

        socketRef.current.on('delete_feed', ({ feed_id }) => {
            setPosts((prevPosts) => prevPosts.filter(post => post.id !== feed_id));
        });

        socketRef.current.on('update_feed', (updatedFeed) => {
            setPosts((prevPosts) => prevPosts.map(post => 
            post.id === updatedFeed.id ? updatedFeed : post
            ));
        });

        socketRef.current.on('new_comment', ({ feed_id, comment }) => {
            setPosts((prevPosts) => prevPosts.map(post => {
                if (post.id === feed_id) {
                    return {
                        ...post,
                        comments: [...post.comments, comment]
                    };
                }
                return post;
            }));
        });

        socketRef.current.on('update_comment', ({ feed_id, comment }) => {
            setPosts(prevPosts => prevPosts.map(post => {
              if (post.id === feed_id) {
                return {
                  ...post,
                  comments: post.comments.map(c => 
                    c.id === comment.id ? { ...c, ...comment } : c
                  )
                };
              }
              return post;
            }));
          });
          
        socketRef.current.on('delete_comment', ({ feed_id, comment_id }) => {
            setPosts((prevPosts) => prevPosts.map(post => {
                if (post.id === feed_id) {
                    return {
                        ...post,
                        comments: post.comments.filter(comment => comment.id !== comment_id)
                    };
                }
                return post;
            }));
        });

        socketRef.current.on('like_feed', ({ feed_id, like_count, groupCode }) => {
            setPosts((prevPosts) => prevPosts.map(post => {
                if (post.id === feed_id) {
                    return {
                        ...post,
                        likes: like_count
                    };
                }
                return post;
            }));
        });
        return () => {
            if (socketRef.current) {
                console.log('Disconnecting Socket in User Profile');
                socketRef.current.emit('leave', { groupCode });
                socketRef.current.off('message');
                socketRef.current.disconnect();
            }
        };
    }, [groupCode])

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const userData = await getUserProfile(username, groupCode);
                setUser(userData.user);
                setPosts(userData.user.feeds);
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
        setGroupCode(location.state?.groupCode || null);
    }, [username, refreshTrigger, navigate, location, groupCode]);

    useEffect(() => {
        const handleClickOutside = (event) => {
          if (!event.target.closest('.post-menu')) {
            setOpenMenus({});
          }
        };
    
        document.addEventListener('click', handleClickOutside);
    
        return () => {
          document.removeEventListener('click', handleClickOutside);
        };
      }, []);

    const handleUserClick = (createdBy) => {
        navigate(`/profile/${createdBy}`, { state: { groupCode } });
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
            await axios.post(`${config.API_URL}/addComment`, {
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
        setEditPhotoPreview(photo ? `${config.API_URL}/uploads/${photo}` : null);
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
            navigate('/login');
            return;
        }
        await deletePost(postId, token);
        setRefreshTrigger(prev => prev + 1);
    };

    const handleLike = async (feed_id) => {
        try {
          const token = localStorage.getItem('token');
          await axios.post(`${config.API_URL}/toggleLike`, 
            { feed_id: feed_id, group_code:groupCode },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
        } catch (error) {
          console.error('Error toggling like:', error);
        }
      };

    if (error) return <div className="alert alert-danger">Error: {error}</div>;
    if (!user) return <div className="alert alert-info">Loading...</div>;

    return (
        <Layout>
            <div className={`feed-container ${darkMode ? 'dark-mode' : ''}`}>
                <div className="profile-header">
                    <h1>{username}'s Profile</h1>
                    <p>User ID: {user.id}</p>
                    <p>Email: {user.email}</p>
                </div>
                <div className="feed-container">
                    <h2>Feeds</h2>
                    {}
                    {posts && posts.length > 0 ? (
                        showFeeds(
                            posts,
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
                            handleLike,
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