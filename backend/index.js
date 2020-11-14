const express = require('Express');
const cors = require('cors');
const mongoose = require('mongoose');
const logger = require('morgan');

const Stone = require('./models/stone');

const app = express();
const port = 3000;

app.use(logger('dev'));
app.use(express.json());
app.use(cors({ origin: true })); // TODO: Is this secure?

app.get('/', async (req, res) => {
  const stones = await Stone.find();
  res.json(stones);
});

app.post('/', async (req, res, next) => {
  try {
    const stone = new Stone(req.body);
    await stone.save();
    res.status(200).json(stone);
  } catch (err) {
    if (err.errors && err.message) {
      // Probably a validation error by mongoose and the client's fault
      res.status(400).send(err.message);
    } else {
      throw(err);
    }
  }
});

mongoose.connect('mongodb://localhost/mpgo',
  { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }
);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('MongoDB connection opened');
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
