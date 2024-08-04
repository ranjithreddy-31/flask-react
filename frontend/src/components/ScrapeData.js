import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { isTokenExpired } from './Utils';
import config from '../config';

const ScrapeData = () => {
    const navigate = useNavigate();
    const [url, setUrl] = useState('');
    const [content, setContent] = useState('Enter the URL to get content');

    const getDataFromUrl = async (event) => {
        event.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if(isTokenExpired(token)){
                navigate('/login');
            }
            const response = await axios.post(`${config.API_URL}/getData`, {
                url: url
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setContent(response.data.summary);
        } catch (error) {
            console.log(error.response);
            if (error.response && error.response.data.error === "token_expired") {
                navigate('/login');
            }
            setContent("Failed to fetch data, try again.");
        }
    };

    return (
        <Layout>
        <div className="container">
            <form onSubmit={getDataFromUrl}>
                <div className="form-group">
                    <label className="label">URL</label>
                    <input type='text' value={url} onChange={(e) => setUrl(e.target.value)} className="form-control" />
                </div>
                <div className="content">
                    {content}
                </div>
                <div>
                    <button type='submit' className="btn btn-primary">Fetch Data</button>
                </div>
            </form>
        </div>
        </Layout>
    );
};

export default ScrapeData;
