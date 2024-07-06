import { Navigate } from 'react-router-dom';
import { isTokenExpired } from './Utils';

const PrivateRoute = ({ children }) => {

    return !isTokenExpired() ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
