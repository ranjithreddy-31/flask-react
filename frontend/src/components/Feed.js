import axios from 'axios';
import React, { useState, useEffect } from 'react'
import AddFeed from './AddFeed';
import Layout from './Layout';
import '../css/Feed.css';
import Comments from './Comments';

function Feed() {
    const [posts, setPosts] = useState([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [comments, setComments] = useState({});
    const [openComments, setOpenComments] = useState({});

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://127.0.0.1:5000/getAllFeeds', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log(response.data.feeds)
                setPosts(response.data.feeds);
            } catch (error) {
                console.error('Error fetching posts:', error);
            }
        };
        fetchPosts();
    }, [refreshTrigger])

    const handleFeedAdded = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleCommentChange = (feedId, value) => {
        setComments(prev => ({...prev, [feedId]: value}));
    };

    const handleAddComment = async (feedId) => {
        try {
            const token = localStorage.getItem('token');
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
                                <p className="post-meta">Created by: {post.created_by}</p>
                                <p className="post-meta">Created at: {new Date(post.created_at).toLocaleString()}</p>
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
                </div>
                <div className="add-feed-section">
                    <h2 className="posts-heading">Any Thoughts?</h2>
                    <AddFeed onFeedAdded={handleFeedAdded} />
                </div>
            </div>
        </Layout>
    )
}

export default Feed