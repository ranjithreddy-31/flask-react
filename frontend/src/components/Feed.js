import axios from 'axios';
import io from 'socket.io-client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AddFeed from './AddFeed';
import { deletePost, getCurrentUser, isTokenExpired, showFeeds, updateFeed } from './Utils';
import Chat from './Chat';
import '../css/Feed.css'; // Assuming you have a CSS file for Feed component

function Feed() {
    const navigate = useNavigate();
    const { groupCode } = useParams();
    const [posts, setPosts] = useState([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [comments, setComments] = useState({});
    const [openComments, setOpenComments] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [openMenus, setOpenMenus] = useState({});
    const [currentUser, setCurrentUser] = useState(null);
    const [editingPost, setEditingPost] = useState(null);
    const [editHeading, setEditHeading] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editPhoto, setEditPhoto] = useState(null);
    const [editPhotoPreview, setEditPhotoPreview] = useState(null);
    const [error, setError] = useState(null);
    // const intervalRef = useRef(null);
    const socketRef = useRef();

    const fetchPosts = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (isTokenExpired(token)) {
                navigate('/login');
                return;
            }
            setIsAuthorized(true);
            const response = await axios.get('http://127.0.0.1:5000/getAllFeeds', {
                params: {
                    page: currentPage,
                    groupCode: groupCode
                },
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            setPosts(response.data.feeds);
            setTotalPages(response.data.pages);
            setError(null);
        } catch (error) {
            console.error('Error fetching posts:', error);
            if (error.response && error.response.status === 401) {
                navigate('/login');
            } else {
                if (error.response && error.response.status === 403) {
                    setError(`Error fetching posts: You are currently not part of this group`);
                } else {
                    setError(`Group doesn't exist or deleted by Admin`);
                }
            }
        }
    }, [currentPage, groupCode, navigate]);

    useEffect(()=>{
        socketRef.current = io('http://127.0.0.1:5000');

        socketRef.current.on('connect', () => {
            console.log('Socket connected');
            socketRef.current.emit('join', { groupCode });
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

        socketRef.current.on('delete_group', ({ groupCode }) => {
            setPosts([]);
            setError("Group doesn't exist or deleted by Admin")
        });
    }, [groupCode])

    useEffect(() => {
        fetchPosts();
        const fetchCurrentUser = async () => {
            const user = await getCurrentUser();
            setCurrentUser(user);
        };
        fetchCurrentUser();

        /*
        This part of code is now deprecated as we are using sockets to update in real time
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(fetchPosts, 5000000); // Fetch every 5 seconds

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };*/
    }, [fetchPosts, refreshTrigger, groupCode]);

    const handleFeedAdded = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleCommentChange = (feedId, value) => {
        setComments(prev => ({...prev, [feedId]: value}));
    };

    const handleAddComment = async (feedId) => {
        try {
            const token = localStorage.getItem('token');
            if (isTokenExpired(token)) {
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
            setError(null);
        } catch (error) {
            console.error('Error adding comment:', error);
            if (error.response && error.response.status === 401) {
                navigate('/login');
            } else {
                setError(`Error adding comment: ${error}`);
            }
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    };

    const handleEditPost = (postId, heading, content, picture) => {
        setEditingPost(postId);
        setEditHeading(heading);
        setEditContent(content);
        setEditPhoto(picture);
    };

    const handlePhotoChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setEditPhoto(file);
            const previewURL = URL.createObjectURL(file);
            setEditPhotoPreview(previewURL);
        }
    };

    const handleDeletePost = async(postId) => {
        try {
            const token = localStorage.getItem('token');
            if (isTokenExpired(token)) {
                navigate('/');
                return;
            }
            await deletePost(postId, token);
            console.log("deleted the post");
            setRefreshTrigger(prev => prev + 1);
            setError(null); // Clear any previous errors
        } catch (error) {
            console.error('Error deleting post:', error);
            setError('Failed to delete post. Please try again.');
        }
    };

    const handleUserClick = (username) => {
        navigate(`/profile/${username}`);
    };

    const handleUpdatePost = async (postId) => {
        try {
            const token = localStorage.getItem('token');
            if (isTokenExpired(token)) {
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

    return (
        <div className="feed-and-chat-container">
            {error && <h1>{error}</h1>}
            <div className="feed-section">
                <div className="feed-container">
                    {/* {error && <h1>{error}</h1>} */}
                    {!error && <AddFeed onFeedAdded={handleFeedAdded} groupCode={groupCode} />}
                    {showFeeds(
                        posts,
                        isAuthorized,
                        openComments,
                        setOpenComments,
                        comments,
                        handleCommentChange,
                        handleAddComment,
                        handleUserClick,
                        currentPage,
                        totalPages,
                        handlePrevPage,
                        handleNextPage,
                        handleEditPost,
                        handleDeletePost,
                        currentUser,
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
                    )}
                </div>
            </div>
            <div className="chat-section">
                {console.log(error)}
                {!error && <Chat groupCode={groupCode} />}
            </div>
        </div>
    );
}

export default Feed;
