import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

export const isTokenExpired = () => {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const decodedToken = jwtDecode(token);
            const currentTime = Date.now() / 1000; // Current time in seconds

            if (decodedToken.exp < currentTime) {
                localStorage.removeItem('token');
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Failed to decode token:', error);
            localStorage.removeItem('token');
            return true;
        }
    }
    return true;
};

export const getUserProfile = async(username) => {
    try {
        const token = localStorage.getItem('token');
        if(isTokenExpired(token))
        {
            throw new Error('Token expired');
        }
        const response = await axios.post('http://127.0.0.1:5000/getUserData', {
            username:username
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
       return response.data
    } catch (error) {
        console.error('Error adding comment:', error);
        return error
    }
  };
