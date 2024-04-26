const mongoose = require("mongoose");

const user = process.env.USER;
const password = process.env.PASSWORD;
const url =
  `mongodb+srv://${user}:${password}@cluster0.1gqoe0y.mongodb.net/shop?retryWrites=true&w=majority&appName=Cluster0`;

const db = () => {
    return mongoose.connect(url, { useUnifiedTopology: true });
}

module.exports = db;