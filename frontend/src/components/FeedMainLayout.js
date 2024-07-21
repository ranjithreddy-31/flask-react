import React, { useState, useCallback, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import FeedGroups from './FeedGroups';
import '../css/FeedMainLayout.css';
import Layout from './Layout';

function FeedMainLayout() {
    const [leftWidth, setLeftWidth] = useState(20); // Initial width in percentage
    const [rightWidth, setRightWidth] = useState(20);
    const leftPaneRef = useRef(null);
    const rightPaneRef = useRef(null);

    const handleMouseDown = useCallback((e, resizeFunc) => {
        e.preventDefault();
        document.addEventListener('mousemove', resizeFunc);
        document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', resizeFunc);
        });
    }, []);

    const resizeLeft = useCallback((e) => {
        if (leftPaneRef.current) {
            const newWidth = (e.clientX / window.innerWidth) * 100;
            setLeftWidth(Math.min(Math.max(newWidth, 10), 40)); // Min 10%, Max 40%
        }
    }, []);

    const resizeRight = useCallback((e) => {
        if (rightPaneRef.current) {
            const newWidth = ((window.innerWidth - e.clientX) / window.innerWidth) * 100;
            setRightWidth(Math.min(Math.max(newWidth, 10), 40)); // Min 10%, Max 40%
        }
    }, []);

    return (
        <Layout>
            <div className="main-layout">
                <div 
                    className="pane left-pane" 
                    ref={leftPaneRef}
                    style={{ width: `${leftWidth}%` }}
                >
                    <FeedGroups />
                </div>
                <div 
                    className="divider"
                    onMouseDown={(e) => handleMouseDown(e, resizeLeft)}
                />
                <div className="pane center-pane">
                    <Outlet />
                </div>
                <div 
                    className="divider"
                    onMouseDown={(e) => handleMouseDown(e, resizeRight)}
                />
                <div 
                    className="pane right-pane" 
                    ref={rightPaneRef}
                    style={{ width: `${rightWidth}%` }}
                >
                    {/* Placeholder for future group chat implementation */}
                </div>
            </div>
        </Layout>
    );
}

export default FeedMainLayout;