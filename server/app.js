const express = require('express');

const PORT = process.env.PORT || 3000;
const app = express();

app.get('/', (req, res) => {
  res.send('Classifieds server is running');
});

app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
});
