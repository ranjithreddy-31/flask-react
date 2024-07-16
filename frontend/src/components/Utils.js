import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import React from 'react';
import Comments from './Comments';


export const isTokenExpired = () => {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const decodedToken = jwtDecode(token);
            const currentTime = Date.now() / 1000; // Current time in seconds

            if (decodedToken.exp < currentTime) {
                localStorage.removeItem('token');
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Failed to decode token:', error);
            localStorage.removeItem('token');
            return true;
        }
    }
    return true;
};

export const getUserProfile = async(username) => {
    try {
        const token = localStorage.getItem('token');
        if(isTokenExpired(token)) {
            throw new Error('Token expired');
        }
        const response = await axios.post('http://127.0.0.1:5000/getUserData', {
            username: username
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
       return response.data;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
};

export const getCurrentUser = async() =>{
    try {
        const token = localStorage.getItem("token");
        if (!token || isTokenExpired(token)) {
            throw new Error('Token expired');
        }
  
        const response = await axios.get(
          'http://127.0.0.1:5000/getCurrentUser',
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
  
        const username = response.data.username;
        return username;
    }
    catch(error)
    {
        console.log(`Failed to fetch current user with error: ${error}`);
    }
}

export const showFeeds = (
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
    setOpenMenus
) => {
    const toggleMenu = (postId) => {
        setOpenMenus(prevState => ({
            ...prevState,
            [postId]: !prevState[postId]
        }));
    };
    return (
        <div className="posts-section">
            {posts.map(post => (
                <div key={post.id} className="post-item">
                    <div className="post-header">
                        <h3 className="post-heading">{post.heading}</h3>
                        <div className="post-menu">
                            <button onClick={() => toggleMenu(post.id)} className="menu-toggle">
                                ⋮
                            </button>
                            {openMenus[post.id] && (
                                <div className="menu-dropdown">
                                    <button 
                                        onClick={() => handleEditPost(post.id)} 
                                        disabled={currentUser !== post.created_by}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDeletePost(post.id)} 
                                        disabled={currentUser !== post.created_by}
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>
                    <p className="post-content">{post.content}</p>
                    {post.picture && isAuthorized && (
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
            {totalPages > 1 && (
                <div className="pagination">
                    <button onClick={handlePrevPage} disabled={currentPage === 1}>Previous</button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button onClick={handleNextPage} disabled={currentPage === totalPages}>Next</button>
                </div>
            )}
        </div>
    );
};

export const deletePost = async(postId, token) => {
    try{
        await axios.delete('http://127.0.0.1:5000/deleteFeed', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: {
                postId: postId
            }
        });
       
    }
    catch(error){
        console.error('Error deleting post:', error);
    }
};