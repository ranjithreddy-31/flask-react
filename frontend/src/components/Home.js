import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Home.css';
import Layout from './Layout';

const Home = () => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState('home');

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
            <div className="home-container">
                <h1 className="home-title">Home Page</h1>
                <p className="home-welcome">Welcome to the Home Page!</p>
                <div className="button-container">
                    <button className="home-button" onClick={() => handleNavigation('scrape_data')}>Web Scraping</button>
                    <button className="home-button" onClick={() => handleNavigation('todo_list')}>Todo List</button>
                    <button className="home-button" onClick={() => handleNavigation('calculator')}>Calculator</button>
                    <button className="home-button" onClick={() => handleNavigation('weather')}>Weather</button>
                    <button className="home-button" onClick={() => handleNavigation('feed')}>Feed</button>
                </div>
            </div>
        </Layout>
    );
};

export default Home;