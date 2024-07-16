import axios from 'axios';
import React, { useState, useEffect } from 'react'
import AddFeed from './AddFeed';
import Layout from './Layout';
import { deletePost, getCurrentUser, isTokenExpired, showFeeds, updateFeed } from './Utils';
import { useNavigate } from 'react-router-dom';

function Feed() {
    const navigate = useNavigate();
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




    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const token = localStorage.getItem('token');
                if(isTokenExpired(token)) {
                    navigate('/login');
                    return;
                }
                setIsAuthorized(true);
                const response = await axios.post('http://127.0.0.1:5000/getAllFeeds', 
                    { page: currentPage },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                setPosts(response.data.feeds);
                setTotalPages(response.data.pages);
            } catch (error) {
                console.error('Error fetching posts:', error);
                if (error.response && error.response.status === 401) {
                    navigate('/login');
                }
            }
        };
        const fetchCurrentUser = async () => {
            const user = await getCurrentUser();
            setCurrentUser(user);
        };
        fetchPosts();
        fetchCurrentUser();
    }, [refreshTrigger, currentPage, navigate]);

    const handleFeedAdded = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleCommentChange = (feedId, value) => {
        setComments(prev => ({...prev, [feedId]: value}));
    };

    const handleAddComment = async (feedId) => {
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
            // Create a preview URL for the selected image
            const previewURL = URL.createObjectURL(file);
            setEditPhotoPreview(previewURL);
        }
    };
    
    

    const handleDeletePost = async(postId) =>{
        const token = localStorage.getItem('token');
        if(isTokenExpired(token)){
            navigate('/');
        }
        await deletePost(postId, token);
        console.log("deleted the post");
        setRefreshTrigger(prev => prev+1);
    }
    const handleUserClick = (username) => {
        navigate(`/profile/${username}`);
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
    

    return (
        <Layout>
            <div className="feed-container">
                <div className="add-feed-section">
                    <AddFeed onFeedAdded={handleFeedAdded} />
                </div>
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
                    editPhotoPreview
                )}       
                            
                </div>
        </Layout>
    )
}

export default Feed;