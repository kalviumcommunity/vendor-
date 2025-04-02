const express = require('express');
const { resolve } = require('path');
const mongoose=require("mongoose")
require('dotenv').config()
const app = express();
const port = 3010;

app.use(express.static('static'));
const db = async ()=>{
  try {
  await  mongoose.connect(process.env.URI)
   console.log("connected successfully")
 } catch (error) {
   console.log(error.message)
}
}
db()
app.get('/', (req, res) => {
  res.sendFile(resolve(__dirname, 'pages/index.html'));
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
