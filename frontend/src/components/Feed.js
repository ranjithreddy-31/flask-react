import axios from 'axios';
import React, { useState, useEffect } from 'react'
import AddFeed from './AddFeed';
import Layout from './Layout';
import Comments from './Comments';
import { isTokenExpired } from './Utils';
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

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const token = localStorage.getItem('token');
                if(isTokenExpired(token)) {
                    navigate('/login')
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
            }
        };
        fetchPosts();
    }, [refreshTrigger, currentPage, navigate])    

    const handleFeedAdded = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleCommentChange = (feedId, value) => {
        setComments(prev => ({...prev, [feedId]: value}));
    };

    const handleAddComment = async (feedId) => {
        try {
            const token = localStorage.getItem('token');
            if(isTokenExpired(token))
            {
                navigate('/login')
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

    const handleUserClick = (username) =>{
        navigate(`/profile/${username}`);
    };

    return (
        <Layout>
            <div className="feed-container">
                <div className="add-feed-section">
                    <AddFeed onFeedAdded={handleFeedAdded} />
                </div>
                <div className="posts-section">
                    {posts.map(post => (
                        <div key={post.id} className="post-item">
                            <h3 className="post-heading">{post.heading}</h3>
                            <p className="post-content">{post.content}</p>
                            {post.picture && isAuthorized &&(
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
                                onClick={() => setOpenComments(prevState => ({...prevState, [post.id]: !prevState[post.id]}))}
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
                    ))}
                    <div className="pagination">
                        <button onClick={handlePrevPage} disabled={currentPage === 1}>Previous</button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button onClick={handleNextPage} disabled={currentPage === totalPages}>Next</button>
                    </div>
                </div>
            </div>
        </Layout>
    )
}

export default Feed