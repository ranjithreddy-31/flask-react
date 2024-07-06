import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import PrivateRoute from './components/PrivateRoute';
import ScrapeData from './components/ScrapeData';
import TodoList from './components/TodoList';
import Calculator from './components/Calculator';
import Weather from './components/Weather';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/scrape_data" element={<PrivateRoute><ScrapeData /></PrivateRoute>} />
        <Route path="/todo_list" element={<PrivateRoute><TodoList /></PrivateRoute>} />
        <Route path="/calculator" element={<PrivateRoute><Calculator /></PrivateRoute>} />
        <Route path="/weather" element={<PrivateRoute><Weather /></PrivateRoute>} />
      </Routes>
    </Router>
  );
};

export default App;
