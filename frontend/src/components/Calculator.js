import React, { useState } from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { isTokenExpired } from './Utils';
import config from '../config';

function Calculator() {
    const navigate = useNavigate();
    const [expression, setExpression] = useState('');
    const [result, setResult] = useState('');

    const getResult = async (event) =>{
        event.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if(isTokenExpired(token)){
                navigate('/login');
            }
            const response = await axios.post(`${config.API_URL}/getResultForExpression`, {
                expression: expression
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setResult(`Result: ${response.data.result}`);
            setExpression('');
        } catch (error) {
            if (error.response && error.response.data.error === "token_expired") {
                navigate('/login');
            }
            console.log('Error while calculatin result', error);
        }
    }

  return (
    <Layout>
        <div>
            <form onSubmit={getResult}>
                <div>
                    <label className="label">Expression:</label>
                </div>
                <div className="form-group">
                    <input type='text' value={expression} onChange={(e) => { setExpression(e.target.value) }} className="form-control" />
                    <button type="submit" className="btn btn-primary">Submit</button>
                </div>
                <div className="result-text">
                    {result}
                </div>
            </form>
        </div>
    </Layout>
  )
}

export default Calculator
