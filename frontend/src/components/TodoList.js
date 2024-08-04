import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from './Layout';
import { isTokenExpired } from './Utils';
import config from '../config';

function TodoList() {
    const navigate = useNavigate();
    const [todoList, setTodoList] = useState([]);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if(isTokenExpired(token)){
                    navigate('/login');
                }
                const response = await axios.get(`${config.API_URL}/getAllItems`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                // Assuming response.data.items is an array of objects with fields 'id', 'task', 'completed', 'createdAt'
                const sortedItems = sortTodoItems(response.data.items);
                setTodoList(sortedItems);
            } catch (error) {
                console.log('Error fetching initial data:', error);
            }
        };

        fetchData();
    }, [navigate]);

    const sortTodoItems = (items) => {
        return items.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1; // Completed items first
            }
            return new Date(b.created_at) - new Date(a.created_at);
        });
    };

    const handleChange = (e) => {
        setInputValue(e.target.value);
    }

    const addItem = async (event) => {
        event.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if(isTokenExpired(token)){
                navigate('/login');
            }
            const response = await axios.post(`${config.API_URL}/addTodoItem`, {
                item: inputValue
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const updatedItems = sortTodoItems([...todoList, response.data.item]);
            setTodoList(updatedItems);
            setInputValue('');
        } catch (error) {
            if (error.response && error.response.data.error === "token_expired") {
                navigate('/login');
            }
            console.log('Error adding item:', error);
        }
    }

    const clearEverything = async () => {
        try {
            const token = localStorage.getItem('token');
            if(isTokenExpired(token)){
                navigate('/login');
            }
            await axios.delete(`${config.API_URL}/clearTodoList`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setInputValue('');
            setTodoList([]);
        } catch (error) {
            console.log('Error clearing todo list:', error);
        }
    }

    const handleCheckboxChange = async (item) => {
        try {
            const token = localStorage.getItem('token');
            if(isTokenExpired(token)){
                navigate('/login');
            }
            await axios.put(`${config.API_URL}/updateTodoItem`, {
                item_id: item.id
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            const updatedItems = sortTodoItems(todoList.map(todo => {
                if (todo.id === item.id) {
                    return { ...todo, completed: !item.completed };
                }
                return todo;
            }));
            setTodoList(updatedItems);
        } catch (error) {
            console.log('Error updating item:', error);
        }
    }

    return (
        <Layout>
            <div className="container">
                <div className="header">
                    <label className="label">Add Item</label>
                </div>
                <div className="input-group">
                    <input type='text' value={inputValue} onChange={handleChange} className="form-control" />
                    <button onClick={addItem} className="btn btn-primary btn-normal">Add item</button>
                    <button onClick={clearEverything} className="btn btn-danger btn-normal">Clear</button>
                </div>
                <div className="list">
                    <ul>
                        {todoList.map((item) => (
                        <li key={item.id} className="list-item">
                        <div className="checkbox-container">
                            <input
                                type="checkbox"
                                id={`item-${item.id}`}
                                checked={item.completed}
                                onChange={() => handleCheckboxChange(item)}
                                className="custom-checkbox"
                            />
                            <label htmlFor={`item-${item.id}`} className={`label ${item.completed ? 'completed' : ''}`}>
                                {item.task}
                            </label>
                        </div>
                    </li>                    
                    ))}
                    </ul>
                </div>
            </div>
        </Layout>
    );
}

export default TodoList;
