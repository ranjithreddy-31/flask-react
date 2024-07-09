import React from 'react'
import '../css/Feed.css';

function Comments({comments}) {
  return (
    <div>
        <div className="comments-list">
            {comments && comments.map(comment => (
            <div key={comment.id} className="comment-item">
                <p className="comment-content">{comment.comment}</p>
                <p className="comment-meta">By: {comment.added_by} at {new Date(comment.added_at).toLocaleString()}</p>
            </div>
            ))}
        </div>
      
    </div>
  )
}

export default Comments
