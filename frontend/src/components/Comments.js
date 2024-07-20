import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import "../css/Comment.css"
function Comments({ comments, groupCode }) {
  const navigate = useNavigate();
  const handleUserClick = (username) =>{
    navigate(`/profile/${username}`, { state: { groupCode } });
  }
  return (
    <div className="comments-container">
      <div className="comments-list">
        {comments && comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <p className="comment-content">{comment.comment}</p>
              <p className="comment-meta">
                By:{' '}
                <button
                  onClick={() => handleUserClick(comment.added_by)}
                  className="user-link"
                >
                  {comment.added_by}
                </button>{' '}
                at {new Date(comment.added_at).toLocaleString()}
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