import axios from 'axios';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faTrashAlt, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import { getCurrentUser, isTokenExpired } from './Utils';
import config from '../config';
import "../css/Comment.css";

function Comments({ comments, groupCode }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [localComments, setLocalComments] = useState(comments);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState('');

  const [darkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  const fetchCurrentUser = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  }, []);
  
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  const handleUserClick = (username) => {
    navigate(`/profile/${username}`, { state: { groupCode } });
  }

  const handleEditComment = (commentId, commentText) => {
    setEditingCommentId(commentId);
    setEditedCommentText(commentText);
  }

  const handleSaveEdit = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      if (isTokenExpired(token)) {
        navigate('/login');
        return;
      }
      await axios.put(`${config.API_URL}/updateComment`, {
        commentId: commentId,
        newComment: editedCommentText
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setLocalComments(prevComments => 
        prevComments.map(comment => 
          comment.id === commentId ? {...comment, comment: editedCommentText} : comment
        )
      );
      setEditingCommentId(null);
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  }

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditedCommentText('');
  }

  const handleDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      if (isTokenExpired(token)) {
        navigate('/login');
        return;
      }
      await axios.delete(`${config.API_URL}/deleteComment`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          commentId: commentId
        }
      });
      setLocalComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }

  return (
    <div className={`comments-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="comments-list">
        {localComments && localComments.length > 0 ? (
          localComments.map(comment => (
            <div key={comment.id} className="comment-item">
              <div className="comment-content-wrapper">
                {editingCommentId === comment.id ? (
                  <div className="edit-comment-form">
                    <input
                      type='text'
                      value={editedCommentText}
                      onChange={(e) => setEditedCommentText(e.target.value)}
                      className="edit-comment-input"
                    />
                    <div className="edit-comment-actions">
                      <div className="icon-container">
                      <FontAwesomeIcon 
                        icon={faSave} 
                        className="save-icon"
                        onClick={() => handleSaveEdit(comment.id)}
                      />
                      <FontAwesomeIcon 
                        icon={faTimes} 
                        className="cancel-icon"
                        onClick={handleCancelEdit}
                      />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="comment-content">{comment.comment}</p>
                    <div className="comment-actions">
                      <FontAwesomeIcon 
                        icon={faPencilAlt} 
                        className="edit-icon"
                        style={{ opacity: currentUser === comment.added_by ? 1 : 0.5 }}
                        onClick={() => currentUser === comment.added_by && handleEditComment(comment.id, comment.comment)}
                      />
                      <FontAwesomeIcon 
                        icon={faTrashAlt} 
                        className="delete-icon"
                        style={{ opacity: currentUser === comment.added_by ? 1 : 0.5 }}
                        onClick={() => currentUser === comment.added_by && handleDeleteComment(comment.id)}
                      />
                    </div>
                  </>
                )}
              </div>
              <p className="comment-meta">
                <span 
                  onClick={() => handleUserClick(comment.added_by)}
                  className="user-link"
                >
                  {comment.added_by}
                </span>{' '}
                · {new Date(comment.added_at).toLocaleString()}
              </p>
            </div>
          ))
        ) : (
          <p className="no-comments">No comments yet.</p>
        )}
      </div>
    </div>
  );
}

export default Comments;
