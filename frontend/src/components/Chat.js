import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import '../css/Chat.css'; // Ensure this CSS file exists
import { getCurrentUser } from './Utils';

const Chat = ({ groupCode }) => {
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState([]);
    const socketRef = useRef();
    const chatContainerRef = useRef();
    const [currentUser, setCurrentUser] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            const user = await getCurrentUser();
            setCurrentUser(user || 'Anonymous');
        };
        fetchUser();
        socketRef.current = io('http://127.0.0.1:5000');
        socketRef.current.emit('join', { groupCode });

        socketRef.current.on('message', (msg) => {
            setChat((prevChat) => [...prevChat, msg]);
        });

        return () => {
            socketRef.current.emit('leave', { groupCode });
            socketRef.current.off('message');
            socketRef.current.disconnect();
        };
    }, [groupCode]);

    useEffect(() => {
        // Scroll to bottom of chat container when new messages arrive
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }, [chat]);

    const sendChat = () => {
        if (message.trim() && socketRef.current) {
            socketRef.current.emit('message', { groupCode, text: message });
            setMessage('');
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h2>Group Chat</h2>
            </div>
            <div className="chat-messages" ref={chatContainerRef}>
                {chat.map((msg, index) => (
                    <div key={index} className="chat-message">
                        <p className="chat-message-text">{msg.text}</p>
                        <span className="chat-message-time">{currentUser}</span>
                    </div>
                ))}
            </div>
            <div className="chat-input-container">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyPress={(e) => e.key === 'Enter' && sendChat()}
                    className="chat-input"
                />
                <button onClick={sendChat} className="chat-send-button">Send</button>
            </div>
        </div>
    );
};

export default Chat;
