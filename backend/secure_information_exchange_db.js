const mysql = require("mysql2");

// Create a pool instead of a single connection
const pool = mysql.createPool({
  host: "localhost",
  port: "3306",
  user: "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Execute a query using the pool
pool
  .promise()
  .query("SELECT * FROM user")
  .then(([rows, fields]) => {
    console.log("Query result:", rows);
  })
  .catch((err) => {
    console.error("Error executing query:", err);
  });

// Export the promise-based pool
module.exports = pool.promise();
