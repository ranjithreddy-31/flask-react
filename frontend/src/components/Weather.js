import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import axios from 'axios';  
import config from '../config';

import { isTokenExpired } from './Utils';

function Weather() {
    const navigate = useNavigate();
    const [location, setLocation] = useState('Dallas');
    const [inputLocation, setInputLocation] = useState('Dallas');
    const [weatherData, setWeatherData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWeatherData = async () => {
            try {
                const token = localStorage.getItem('token');
                if(isTokenExpired(token)){
                    navigate('/login');
                }
                const response = await axios.post(`${config.API_URL}/getWeather`, 
                    { city: location },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
                const data = response.data.weather;
                setWeatherData(data);
                setError(null);
            } catch (error) {
                console.error(error);
                setError('Failed to fetch weather data. Please check the city name and try again.');
                setWeatherData(null);
            }
        };

        fetchWeatherData();
    }, [location, navigate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLocation(inputLocation);
    };

    return (
        <Layout>
            <div className="weather-container">
                <form onSubmit={handleSubmit} className="weather-form">
                    <div className="form-group">
                        <label className="label">Location:</label>
                        <input
                            type='text'
                            value={inputLocation}
                            onChange={(e) => setInputLocation(e.target.value)}
                            className="form-control"
                        />
                        <button type="submit" className="btn btn-primary">Submit</button>
                    </div>
                </form>
                {error && <p className="error">{error}</p>}
                {weatherData && (
                    <div className="weather-data">
                        <h3 className="city-name">Weather in {weatherData.city}</h3>
                        <div className="weather-main">
                            <img src={weatherData.icon} alt="weather icon" className="weather-icon" />
                            <div>
                                <p className="temperature">{weatherData.temperature}</p>
                                <p className="weather-description">{weatherData.weather}</p>
                            </div>
                        </div>
                        <div className="weather-details">
                            <div className="detail-item">
                                <span className="detail-label">Feels Like:</span>
                                <span>{weatherData.feels_like}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Min/Max Temp:</span>
                                <span>{weatherData.temp_min} / {weatherData.temp_max}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Pressure:</span>
                                <span>{weatherData.pressure} hPa</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Humidity:</span>
                                <span>{weatherData.humidity}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Visibility:</span>
                                <span>{weatherData.visibility} m</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Wind:</span>
                                <span>{weatherData.wind_speed} m/s, {weatherData.wind_degree}</span>
                            </div>
                        </div>
                        <div className="sun-times">
                            <div className="sun-item">
                                <span className="sun-label">Sunrise:</span>
                                <span>{weatherData.sunrise}</span>
                            </div>
                            <div className="sun-item">
                                <span className="sun-label">Sunset:</span>
                                <span>{weatherData.sunset}</span>
                            </div>
                        </div>
                        <p className="local-time">Local Time: {weatherData.local_time}</p>
                        <p className="coordinates">Coordinates: {weatherData.coordinates}</p>
                    </div>
                )}
            </div>
        </Layout>
    );
}

export default Weather;