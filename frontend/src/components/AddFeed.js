import React, { useState } from 'react'
import { isTokenExpired } from './Utils';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/AddFeed.css';

function AddFeed({onFeedAdded}) {
    const navigate = useNavigate();
    const [heading, setHeading] = useState('');
    const [content, setContent] = useState('');
    const [message, setMessage] = useState('Shoot your Post!!')
    const addFeed = async(event) =>{
        event.preventDefault();
        try{
            const token = localStorage.getItem('token');
            if(isTokenExpired(token)){
                navigate('/login');
            }
            await axios.post("http://127.0.0.1:5000/addFeed", {
                heading: heading,
                content: content
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setMessage('Successfully added you post, make another one?');
            onFeedAdded();
        } catch (error) {
            if (error.response && error.response.data.error === "token_expired") {
                navigate('/login');
            }
            console.log('Error adding feed:', error);
        }
    }
  return (
        <div className="add-feed-container">
            <form onSubmit={addFeed} className="add-feed-form">
                <div className="form-group">
                    <label htmlFor="heading">Heading:</label>
                    <input type="text" id="heading" name="heading" maxLength="100" onChange={(e)=>setHeading(e.target.value)} required className="form-control"/>
                </div>
                <div className="form-group">
                    <label htmlFor="content">Content:</label>
                    <textarea id="content" name="content" maxLength="300" required onChange={(e)=>setContent(e.target.value)} className="form-control"></textarea>
                </div>
                <button type="submit" className="btn btn-primary">Submit Feed</button>
            </form>
            <p className="message">{message}</p>
        </div>
  )
}

export default AddFeed
