import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faHeart, faComment } from '@fortawesome/free-solid-svg-icons';
import DOMPurify from 'dompurify';
import config from '../config';
import Comments from './Comments';
import '../css/Feed.css';


export const isTokenExpired = (token) => {
    
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

export const getUserProfile = async (username, groupCode) => {
    try {
        const token = localStorage.getItem('token');
        if (isTokenExpired(token)) {
            throw new Error('Token expired');
        }
        const response = await axios.get(`${config.API_URL}/getUserData`, {
            params: {
                username: username,
                groupCode: groupCode
            },
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
          `${config.API_URL}/getCurrentUser`,
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
) => {
    const toggleMenu = (event, postId) => {
        event.preventDefault();
        setOpenMenus(prevState => ({
            ...prevState,
            [postId]: !prevState[postId]
        }));
    };
    const createMarkup = (html) => {
        return { __html: DOMPurify.sanitize(html) };
    };
    return (
        <div className="posts-section">
            {posts.map(post => (
                <div key={`${groupCode}_${post.id}`} className="post-item">
                    <div className="post-header">
                        {editingPost === post.id ? (
                            <h3 className="post-heading">{editHeading}</h3>
                        ) : (
                            <h3 className="post-heading">{post.heading}</h3>
                        )}
                        <div className="post-menu">
                            <button onClick={(event) => toggleMenu(event, post.id)} className="menu-toggle">
                                ⋮
                            </button>
                            {openMenus[post.id] && (
                                <div className="menu-dropdown">
                                    <button 
                                        onClick={() => handleEditPost(post.id, post.heading, post.content, post.picture)} 
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
                    <div className="post-meta">
                            <span>
                                By:{' '}
                                <button onClick={() => handleUserClick(post.created_by)} className="user-link">
                                    {post.created_by}
                                </button>{' '}
                                at {new Date(post.created_at).toLocaleString()}
                            </span>
                        </div>
                    {editingPost === post.id ? (
                        <div className="edit-post-container">
                            <form className="edit-post-form" onSubmit={(e) => {
                                e.preventDefault();
                                handleUpdatePost(post.id);
                            }}>
                                <input
                                    type="text"
                                    value={editHeading}
                                    onChange={(e) => setEditHeading(e.target.value)}
                                    className="edit-heading-input"
                                    placeholder="Edit heading"
                                />
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="edit-content-textarea"
                                    placeholder="Edit content"
                                />
                                <div className="feed-actions">
                                    <label className="photo-button action-button">
                                        <input
                                            type="file"
                                            onChange={handlePhotoChange}
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                        />
                                        <i className="fas fa-image"></i> Photo
                                    </label>
                                    <div className="buttons-group">
                                        <button type="submit" className="post-button action-button">
                                            Update
                                        </button>
                                        <button type="button" onClick={() => handleEditPost(null)} className="cancel-button action-button">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                                {editPhotoPreview && (
                                    <div className="photo-preview">
                                        <img src={editPhotoPreview} alt="Updated file" className="edit-photo-preview" />
                                        <p>New photo selected</p>
                                    </div>
                                )}
                            </form>
                        </div>
                    ) : (
                        <>
                            
                            <p 
                                className="post-content"
                                dangerouslySetInnerHTML={createMarkup(post.content)}
                            />
                            {post.picture && isAuthorized && (
                                <div className="post-image-container">
                                    <img 
                                        src={`${config.API_URL}/uploads/${post.picture}`} 
                                        alt="Post" 
                                        className="post-image"
                                    />
                                </div>
                            )}
                        </>
                    )}
                    <button onClick={() => handleLike(post.id)} className="action-button like-button">
                        <FontAwesomeIcon icon={faHeart} />
                        <span className="action-count">{post.likes}</span>
                    </button>

                    <button 
                        onClick={() => setOpenComments(prevState => ({...prevState, [post.id]: !prevState[post.id]}))}
                        className="action-button comment-button"
                    >
                        <FontAwesomeIcon icon={faComment} />
                        <span className="action-count">{post.comments.length}</span>
                    </button>
                    {openComments[post.id] && <Comments comments={post.comments} groupCode={groupCode}/>}
                    <div className="comment-input-container">
                        <div className="input-wrapper">
                            <input
                                type="text"
                                value={comments[post.id] || ''}
                                onChange={(e) => handleCommentChange(post.id, e.target.value)}
                                placeholder="Write a comment..."
                                className="comment-input"
                            />
                            <div className="icon-container">
                            <button 
                                onClick={() => handleAddComment(post.id)} 
                                className="send-comment-button"
                            >
                             <FontAwesomeIcon icon={faPaperPlane} />
                            </button>
                            </div>
                        </div>
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
        await axios.delete(`${config.API_URL}/deleteFeed`, {
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

export const updateFeed = async (postId, formData, token) => {
    try {
        const response = await axios.put(`${config.API_URL}/updateFeed/${postId}`, 
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error updating feed:', error);
        throw error;
    }
};
