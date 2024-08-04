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
import Feed from './components/Feed';
import UserProfile from './components/UserProfile';
import FeedGroups from './components/FeedGroups';
import FeedMainLayout from './components/FeedMainLayout';
import Chat from './components/Chat';
import AboutGroup from './components/AboutGroup';

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
        <Route path="/profile/:username" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
        <Route path="/feedgroups" element={<PrivateRoute><FeedGroups /></PrivateRoute>} />
        <Route path="/feed" element={<PrivateRoute><FeedMainLayout /></PrivateRoute>}>
          <Route path=":groupCode" element={<Feed />} />
          <Route path=":groupCode/about" element={<AboutGroup />} />
        </Route>
        <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
      </Routes>
    </Router>
  );
};

export default App;
