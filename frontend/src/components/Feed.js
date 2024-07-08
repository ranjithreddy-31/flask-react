import axios from 'axios';
import React, { useState, useEffect } from 'react'
import AddFeed from './AddFeed';
import Layout from './Layout';
import '../css/Feed.css';

function Feed() {
    const [posts, setPosts] = useState([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

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
                            </div>
                        ))}
                    </div>
                </div>
                <div className="add-feed-section">
                    <h2>Add New Feed</h2>
                    <AddFeed onFeedAdded={handleFeedAdded} />
                </div>
            </div>
        </Layout>
    )
}

export default Feed