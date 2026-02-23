const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",       // your postgres user
  host: "localhost",
  database: "ticket_systeme", // your database name
  password: "amml",       // your postgres password
  port: 5432,
});

module.exports = pool;