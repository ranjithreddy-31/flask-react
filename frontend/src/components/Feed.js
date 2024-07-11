import axios from 'axios';
import React, { useState, useEffect } from 'react'
import AddFeed from './AddFeed';
import Layout from './Layout';
import '../css/Feed.css';
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

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const token = localStorage.getItem('token');
                if(isTokenExpired(token)) {
                    navigate('/login')
                }
                const response = await axios.post('http://127.0.0.1:5000/getAllFeeds', 
                    { page: currentPage },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                console.log(response.data);
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
        console.log(currentPage, totalPages)
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    };

    return (
        <Layout>
            <div className="feed-container">
                <div className="posts-section">
                    <h2 className="posts-heading">All Feeds</h2>
                    <div className="posts-list">
                    {posts.map(post => (
                            <div key={post.id} className="post-item">
                                <h3 className="post-heading">{post.heading}</h3>
                                <p className="post-content">{post.content}</p>
                                <p className="post-meta">By: {post.created_by} at {new Date(post.created_at).toLocaleString()}</p>
                                <button 
                                    onClick={() => setOpenComments(prevState => ({...prevState, [post.id]: !prevState[post.id]}))}
                                    className="toggle-comments-button"
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
                    </div>
                    <div className="pagination">
                    <button onClick={handlePrevPage} disabled={currentPage === 1}>Previous</button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button onClick={handleNextPage} disabled={currentPage === totalPages}>Next</button>
                </div>
                </div>
                
                <div className="add-feed-section">
                    <h2 className="posts-heading">Any Feeds?</h2>
                    <AddFeed onFeedAdded={handleFeedAdded} />
                </div>
            </div>
        </Layout>
    )
}

export default Feed