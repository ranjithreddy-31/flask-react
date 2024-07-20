# Flask + React App

This project is a full-stack application built with Flask (for the backend) and React (for the frontend). It includes several endpoints for managing different functionalities.

## Features
- **Fee:**
  - Allows users to add a feed and comments under it.
  - Update [07/15/2024]
    - Users can add photos in their posts and can view profiles
    - Users should be able to delete their posts now
    
- **Todo List:**
  - Allows users to add, delete, and mark tasks as completed.
  - Utilizes SQLite for local database storage.
  - Authentication with JWT tokens.

- **Expression Calculator:**
  - Evaluates mathematical expressions provided by the user.
  - Handles basic arithmetic operations and parentheses.

- **Web Scraper:**
  - Scrapes data from specified websites.
  - Summarizes scraped data us NLTK.

## Technologies Used

- **Backend:**
  - Flask
  - SQLite for local database

- **Frontend:**
  - React
  - Axios for API calls

## Getting Started

To run this project locally, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/ranjithreddy-31/flask-react.git
   cd flask-react
2. Run backend server on port A
    ```bash
    cd backend
    python3 main.py
3. Run frontend server on port B
 ```bash
    cd frontend
    npm start
