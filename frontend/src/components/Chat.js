import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { getCurrentUser, isTokenExpired } from './Utils';
import { useNavigate } from 'react-router-dom';
import '../css/Chat.css';
import config from '../config';

function Chat({ groupCode }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState();
    const navigate = useNavigate();
    const socketRef = useRef();
    const chatContainerRef = useRef();

    const [darkMode] = useState(() => {
        return localStorage.getItem('darkMode') === 'true';
      });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (isTokenExpired(token)) {
            setError('Session expired. Please log in again.');
            return;
        }

        const fetchCurrentUser = async() =>{
            setCurrentUser(await getCurrentUser());
        }

        const fetchMessages = async () => {
            try {
                const response = await axios.get(`${config.API_URL}/group/${groupCode}/messages`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessages(response.data.messages);
                setError(null);
            } catch (error) {
                console.error('Error fetching messages:', error);
                setError('Failed to fetch messages. Please try again.');
            }
        };
        fetchCurrentUser();
        fetchMessages();

        socketRef.current = io(`${config.API_URL}`);

        socketRef.current.on('connect', () => {
            console.log('Socket connected in Chat');
            socketRef.current.emit('join', { groupCode });
        });

        socketRef.current.on('connect_error', (error) => {
            console.error('Socket connection error in Chat:', error);
            setError('Failed to connect to chat server. Please try again.');
        });

        socketRef.current.on('message', (message) => {
            setMessages((prevMessages) => [...prevMessages, message]);
        });

        return () => {
            console.log('Disconnecting Socket in Chat');
            socketRef.current.emit('leave', { groupCode });
            socketRef.current.off('message');
            socketRef.current.disconnect();
        };
    }, [groupCode]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const sendChat = async (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            try {
                const token = localStorage.getItem('token');
                if (isTokenExpired(token)) {
                    setError('Session expired. Please log in again.');
                    return;
                }
                await axios.post(`${config.API_URL}/group/${groupCode}/messages`, 
                    { content: newMessage },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setNewMessage('');
                setError(null);
            } catch (error) {
                console.error('Error sending message:', error);
                setError('Failed to send message. Please try again.');
            }
        }
    };

    const handleUserClick = (username) =>{
        console.log(username, groupCode)
        navigate(`/profile/${username}`, { state: { groupCode } });
    }

    return (
        <div className={`chat-container ${darkMode ? 'dark-mode' : ''}`}>
            <div className="chat-header">
                <h2>Group Chat</h2>
            </div>
            {error && <p className="error-message">{error}</p>}
            <div className="chat-messages" ref={chatContainerRef}>
                {messages.map((msg, index) => (
                    <div key={index} className={`chat-message-wrapper ${currentUser === msg.user ? 'chat-message-right' : 'chat-message-left'}`}>
                        {currentUser !== msg.user && (
                            <div className="profile-photo">
                                <strong>
                                    <button
                                        onClick={() => handleUserClick(msg.user)}
                                        className="chat-user-link"
                                    >
                                        {msg.user.charAt(0).toUpperCase()}
                                        </button>
                                </strong>
                            </div>
                        )}
                        <div className={`chat-message ${currentUser === msg.user ? 'chat-message-right' : 'chat-message-left'}`}>
                            {/* {currentUser !== msg.user
                             && (
                                <strong>
                                    <button
                                        onClick={() => handleUserClick(msg.user)}
                                        className="chat-user-link"
                                    >
                                        {msg.user}: 
                                    </button>
                                </strong>
                            )} */}
                             {msg.text}
                             <span className="chat-message-time">
                                {new Date(msg.timestamp).toLocaleDateString([], {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: '2-digit'
                                })} {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={sendChat} className="chat-input-container">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="chat-input"
                />
                <button type="submit" className="chat-send-button">Send</button>
            </form>
        </div>
    );
    
}

export default Chat;