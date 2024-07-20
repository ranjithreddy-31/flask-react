import React, { useState, useRef, useEffect } from 'react'
import { isTokenExpired } from './Utils';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AddFeed({onFeedAdded, groupCode}) {
    const navigate = useNavigate();
    const [heading, setHeading] = useState('');
    const [content, setContent] = useState('');
    const [photo, setPhoto] = useState(null);
    const [message, setMessage] = useState('')
    const [isExpanded, setIsExpanded] = useState(false);
    const fileInputRef = useRef(null);
    const formRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (formRef.current && !formRef.current.contains(event.target)) {
                handleCancel();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const addFeed = async(event) => {
        event.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if(isTokenExpired(token)){
                navigate('/login');
                return;
            }

            let photoBase64 = null;
            if (photo) {
                photoBase64 = await convertToBase64(photo);
            }

            await axios.post("http://127.0.0.1:5000/addFeed", {
                heading: heading,
                content: content,
                photo: photoBase64,
                groupCode: groupCode
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            setHeading('');
            setContent('');
            setPhoto(null);
            setMessage('Post added successfully!');
            setIsExpanded(false);
            onFeedAdded();
        } catch (error) {
            if (error.response && error.response.data.error === "token_expired") {
                navigate('/login');
            }
            console.log('Error adding feed:', error);
            setMessage('Failed to add post. Please try again.');
        }
    }

    const handlePhotoChange = (e) => {
        setPhoto(e.target.files[0]);
    }

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    const handleExpand = () => {
        setIsExpanded(true);
    }

    const handleCancel = () => {
        setIsExpanded(false);
        setHeading('');
        setContent('');
        setPhoto(null);
        setMessage('');
    }

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }

    return (
        <div className="add-feed-container" ref={formRef}>
            <form onSubmit={addFeed} className="add-feed-form">
                {!isExpanded ? (
                    <div className="add-feed-prompt" onClick={handleExpand}>
                        What's on your mind?
                    </div>
                ) : (
                    <>
                        <input 
                            type="text" 
                            placeholder="Add a heading..."
                            onChange={(e) => setHeading(e.target.value)} 
                            value={heading}
                            className="feed-input heading-input"
                        />
                        <textarea 
                            placeholder="What's on your mind?"
                            onChange={(e) => setContent(e.target.value)} 
                            value={content}
                            className="feed-input content-input"
                        ></textarea>
                        {photo && <div className="photo-preview">Photo selected: {photo.name}</div>}
                        <div className="feed-actions">
                            <button type="button" onClick={triggerFileInput} className="action-button photo-button">
                                📷 Photo
                            </button>
                            <div className="buttons-group">
                                <button type="button" onClick={handleCancel} className="action-button cancel-button">Cancel</button>
                                <button type="submit" className="action-button post-button">Post</button>
                            </div>
                        </div>
                    </>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handlePhotoChange} 
                    style={{display: 'none'}}
                    accept="image/*"
                />
            </form>
            {message && <p className="message">{message}</p>}
        </div>
    )
}

export default AddFeed