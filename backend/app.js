const express = require("express");
const cors = require("cors"); // Import cors package
const app = express();
const indexRouter = require("./routes/index");
require("dotenv").config();

app.use(express.json());

// Enable CORS middleware
app.use(cors());

app.use("/", indexRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
