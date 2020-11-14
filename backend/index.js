const express = require('Express');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors({ origin: true })); // TODO: Is this secure?

app.get('/', (req, res) => {
  res.json([
      { x: 3, y: 4, team: 'black' },
      { x: 7, y: 7, team: 'white' }
  ]);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
