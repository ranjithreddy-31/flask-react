import React from 'react';
import { useNavigate } from 'react-router-dom';
import "../css/Comment.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faTrashAlt } from '@fortawesome/free-solid-svg-icons';

function Comments({ comments, groupCode }) {
  const navigate = useNavigate();
  const handleUserClick = (username) =>{
    navigate(`/profile/${username}`, { state: { groupCode } });
  }

  const handleEditComment = () =>{
    console.log("You clicked edit comment")
  }
  const handleDeleteComment = (commentId) =>{
    console.log("You clicked delete comment")
  }

return (
  <div className="comments-container">
    <div className="comments-list">
      {comments && comments.length > 0 ? (
        comments.map(comment => (
          <div key={comment.id} className="comment-item">
          <div className="comment-content-wrapper">
            <p className="comment-content">{comment.comment}</p>
            <div className="comment-actions">
              <FontAwesomeIcon 
                icon={faPencilAlt} 
                className="edit-icon"
                onClick={() => handleEditComment(comment.id)}
              />
              <FontAwesomeIcon 
                icon={faTrashAlt} 
                className="delete-icon"
                onClick={() => handleDeleteComment(comment.id)}
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