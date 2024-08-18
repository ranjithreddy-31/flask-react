import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Home.css';
import Layout from './Layout';

const Home = () => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState('home');
    const [darkMode] = useState(() => {
        return localStorage.getItem('darkMode') === 'true';
      });

    useEffect(() => {
        if (currentPage !== 'home') {
            navigate(`/${currentPage}`);
        }
    }, [currentPage, navigate]);

    const handleNavigation = (page) => {
        setCurrentPage(page);
    };

    return (
        <Layout>
            <div className={`home-container ${darkMode ? 'dark-mode' : ''}`}>
                <div className="home-content">
                    <h1 className="home-title">Welcome</h1>
                    <p className="home-welcome">Where every chat sparks a connection and every feed tells a story.</p>
                </div>    
                <div className="button-container">
                    {/* <button className="home-button" onClick={() => handleNavigation('scrape_data')}>Web Scraping</button>
                    <button className="home-button" onClick={() => handleNavigation('todo_list')}>Todo List</button>
                    <button className="home-button" onClick={() => handleNavigation('calculator')}>Calculator</button>
                    <button className="home-button" onClick={() => handleNavigation('weather')}>Weather</button> */}
                    <button className="home-button" onClick={() => handleNavigation('feed')}>Feed</button>
                </div>
            </div>
        </Layout>
    );
};

export default Home;