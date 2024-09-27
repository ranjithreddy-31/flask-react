import React, { useState, useRef, useEffect } from 'react'
import { isTokenExpired } from './Utils';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config'
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles
import DOMPurify from 'dompurify';

function AddFeed({onFeedAdded, groupCode}) {
    const navigate = useNavigate();
    const [heading, setHeading] = useState('');
    const [content, setContent] = useState('');
    const [photo, setPhoto] = useState(null);
    const [message, setMessage] = useState('')
    const [isExpanded, setIsExpanded] = useState(false);
    const fileInputRef = useRef(null);
    const formRef = useRef(null);

    const [darkMode] = useState(() => {
        return localStorage.getItem('darkMode') === 'true';
    });

    // Quill modules configuration
    const modules = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'header': 1 }, { 'header': 2 }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            ['link', 'image'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'font': [] }],
            [{ 'align': [] }],
            ['clean']
        ],
    };

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

            // Sanitize the content before sending to the server
            const sanitizedContent = DOMPurify.sanitize(content);

            await axios.post(`${config.API_URL}/addFeed`, {
                heading: heading,
                content: sanitizedContent,
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
    const beautifyText = async() =>{
        const token = localStorage.getItem('token');
            if(isTokenExpired(token)){
                navigate('/login');
                return;
            }
        const response = await axios.get(`${config.API_URL}/getBeautifiedContent`, {
            params: {
                content: content
            },
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(response);
        setContent(response.data.content);
    }

    return (
        <div className={`add-feed-container ${darkMode ? 'dark-mode' : ''}`} ref={formRef}>
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
                        <ReactQuill 
                            theme="snow"
                            value={content}
                            onChange={setContent}
                            modules={modules}
                            placeholder="What's on your mind?"
                            className="feed-input content-input"
                        />
                        {photo && <div className="photo-preview">Photo selected: {photo.name}</div>}
                        <div className="feed-actions">
                            <button type="button" onClick={triggerFileInput} className="action-button photo-button">
                                📷 Photo
                            </button>
                            <button type="button" onClick={beautifyText} className="action-button beautify-button">
                                🪄
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