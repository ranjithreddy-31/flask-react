// auth.js
import axios from 'axios';
import { isTokenExpired } from './Utils';

export const logout = async () => {
    try {
        const token = localStorage.getItem('token');
        if (isTokenExpired(token)){
            return true;
        }
        await axios.post('http://127.0.0.1:5000/logout', {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        localStorage.removeItem('token');
        return true;
    } catch (error) {
        console.error('Logout failed', error);
        return false;
    }
};