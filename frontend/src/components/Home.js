// Home.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Home.css';
import Layout from './Layout';

const Home = () => {
    const navigate = useNavigate();
    const [webScrape, setWebScrape] = useState(false);
    const [todoList, setTodoList] = useState(false);
    const [calculator, setCalculator] = useState(false);
    const [weather, setWeather] = useState(false);

    useEffect(() => {
        if (webScrape) navigate('/scrape_data');
        if (todoList) navigate('/todo_list');
        if (calculator) navigate('/calculator');
        if (weather) navigate('/weather');
    }, [webScrape, todoList, calculator, weather, navigate]);

    return (
        <Layout>
        <div className="home-container">
            <h1 className="home-title">Home Page</h1>
            <p className="home-welcome">Welcome to the Home Page!</p>
            <div className="button-container">
                <button className="home-button" onClick={() => setWebScrape(true)}>Web Scraping</button>
                <button className="home-button" onClick={() => setTodoList(true)}>Todo List</button>
                <button className="home-button" onClick={() => setCalculator(true)}>Calculator</button>
                <button className="home-button" onClick={() => setWeather(true)}>Weather</button>
            </div>
        </div>
        </Layout>
    );
};

export default Home;