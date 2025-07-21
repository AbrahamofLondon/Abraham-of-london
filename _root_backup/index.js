const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Example dynamic route with a named param (correct!)
app.get('/user/:id', (req, res) => {
  res.send(`User ID is ${req.params.id}`);
});

// Hello route
app.get('/hello', (req, res) => {
  res.send('Hello Abraham, your dynamic site is working!');
});

// Fallback for 404
app.get('*', (req, res) => {
  res.status(404).send('Page not found.');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
