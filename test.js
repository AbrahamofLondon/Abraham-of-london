const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/user/:id', (req, res) => {
  res.send(`User ID is ${req.params.id}`);
});

app.get('/hello', (req, res) => {
  res.send('Hello Abraham, your dynamic site is working!');
});

app.get('*', (req, res) => {
  res.status(404).send('Page not found.');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
