// Load environment variables from .env file
require('dotenv').config();



// Import express package
const express = require('express');

// Import cors package
const cors = require('cors');

const db = require('./db/index');

// Create the express app
const app = express();

// Middleware — these lines teach Express to understand JSON
// and allow requests from your React frontend
app.use(cors());
app.use(express.json());

// Your first API route — a simple test
// When someone visits http://localhost:5000/api/test
// they get this response
app.get('/api/test', (req, res) => {
  res.json({ message: 'Rapid Route backend is working!' });
});

// Read the port from .env file (5000)
const PORT = process.env.PORT || 5000;

// Start the server and listen for requests
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});