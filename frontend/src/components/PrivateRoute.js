import { Navigate } from 'react-router-dom';
import { isTokenExpired } from './Utils';

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return !isTokenExpired(token) ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
