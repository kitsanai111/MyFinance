const express = require('express')
const morgan = require('morgan')
const app = express();
const cors = require('cors')

app.get('/', (req, res) => {
    res.status(200).send('API Server is running successfully!');
});

app.use(cors())
app.use(morgan('dev'));
app.use(express.json());
const { readdirSync } = require('fs');

readdirSync('./routes').forEach(file => {
  const route = require('./routes/' + file);
  if (typeof route === 'function') {
    app.use('/api', route);
  } else {
    console.warn(`Warning: ${file} does not export a router function.`);
  }
});

app.listen(5001, () => {
    console.log('Server is running on port 5001');
});
