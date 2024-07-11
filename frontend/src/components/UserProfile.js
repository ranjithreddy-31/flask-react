import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { getUserProfile } from './Utils';
import Layout from './Layout';

function UserProfile() {
    const [user, setUser] = useState();
    const [error, setError]  = useState();
    const { username } = useParams();
    const navigate = useNavigate();
    useEffect(()=>{
        const fetchUserProfile = async () => {
            try {
              const userData = await getUserProfile(username);
              console.log(userData.user)
              setUser(userData.user);
            } catch (err) {
              setError(err.message);
              if (err.message === 'Token expired') {
                navigate('/login');
              }
            }
          };
      
        fetchUserProfile();
    }, [username, navigate]);

    if (error) return <div>Error: {error}</div>;
    if (!user) return <div>User not found</div>;

    return (
        <Layout>
            <div className="user-profile">
            <div className="profile-header">
                <h1>{username}'s Profile</h1>
                <p>User ID: {user.id}</p>
                <p>Email: {user.email}</p>
            </div>

            <div className="feeds-section">
                <h2>Feeds</h2>
                {user.feeds.length > 0 ? (
                user.feeds.map((feed) => (
                    <div key={feed.id} className="feed-item">
                        <h3>{feed.heading}</h3>
                        <p>{feed.content}</p>
                        <div className="feed-meta">
                            <span>Created at: {new Date(feed.created_at).toLocaleString()}</span>
                         </div>
                    </div>
                ))
                ) : (
                    <p>No feeds available.</p>
                )}
            </div>
            </div>
        </Layout>
    )
}

export default UserProfile
