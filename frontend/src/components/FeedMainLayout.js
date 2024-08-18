import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import FeedGroups from './FeedGroups';
import { isTokenExpired } from './Utils';
import '../css/FeedMainLayout.css';
import Layout from './Layout';

function FeedMainLayout() {
    const [leftWidth, setLeftWidth] = useState(20);
    const leftPaneRef = useRef(null);
    const navigate = useNavigate();

    const [darkMode] = useState(() => {
        return localStorage.getItem('darkMode') === 'true';
      });

    useEffect(()=>{
        const token = localStorage.getItem('token');
        if (isTokenExpired(token)) {
            navigate('/login');
                return;
        }
    })

    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        const startX = e.pageX;
        const startWidth = leftPaneRef.current.getBoundingClientRect().width;

        const handleMouseMove = (moveEvent) => {
            const newWidth = ((startWidth + moveEvent.pageX - startX) / window.innerWidth) * 100;
            setLeftWidth(Math.min(Math.max(newWidth, 10), 40)); // Min 10%, Max 40%
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, []);

    return (
        <Layout>
            <div className={`main-layout ${darkMode ? 'dark-mode' : ''}`}>
                <div 
                    className="pane left-pane" 
                    ref={leftPaneRef}
                    style={{ width: `${leftWidth}%`, marginTop: '10px' }}
                >
                    <FeedGroups />
                </div>
                <div 
                    className="divider"
                    onMouseDown={handleMouseDown}
                />
                <div className="pane right-pane">
                    <Outlet />
                </div>
            </div>
        </Layout>
    );
}

export default FeedMainLayout;