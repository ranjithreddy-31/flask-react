import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { getCurrentUser, isTokenExpired } from './Utils';
import "../css/Comment.css";

function Comments({ comments, groupCode }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [localComments, setLocalComments] = useState(comments);

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

  const handleEditComment = (commentId) => {
    console.log("You clicked edit comment", commentId);
  }

  const handleDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      if (isTokenExpired(token)) {
        navigate('/login');
        return;
      }
      await axios.delete('http://127.0.0.1:5000/deleteComment', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          commentId: commentId
        }
      });
      // Update local state after successful deletion
      setLocalComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }

  return (
    <div className="comments-container">
      <div className="comments-list">
        {localComments && localComments.length > 0 ? (
          localComments.map(comment => (
            <div key={comment.id} className="comment-item">
              <div className="comment-content-wrapper">
                <p className="comment-content">{comment.comment}</p>
                <div className="comment-actions">
                  <FontAwesomeIcon 
                    icon={faPencilAlt} 
                    className="edit-icon"
                    style={{ opacity: currentUser === comment.added_by ? 1 : 0.5 }}
                    onClick={() => currentUser === comment.added_by && handleEditComment(comment.id)}
                  />
                  <FontAwesomeIcon 
                    icon={faTrashAlt} 
                    className="delete-icon"
                    style={{ opacity: currentUser === comment.added_by ? 1 : 0.5 }}
                    onClick={() => currentUser === comment.added_by && handleDeleteComment(comment.id)}
                  />
                </div>
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
