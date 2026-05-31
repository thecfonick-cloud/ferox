const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root directory (parent of api/)
app.use(express.static(path.join(__dirname, '..')));

// Database connection variables
let isPostgres = false;
let pgClient = null;
let sqliteDb = null;

// Determine which database to connect to
if (process.env.DATABASE_URL) {
  isPostgres = true;
  console.log("Connecting to PostgreSQL database...");
  const { Client } = require('pg');
  pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  pgClient.connect()
    .then(() => {
      console.log("Connected to PostgreSQL successfully.");
      // Initialize Postgres table
      return pgClient.query(`
        CREATE TABLE IF NOT EXISTS reservations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          country VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    })
    .then(() => console.log("PostgreSQL reservations table ready."))
    .catch(err => {
      console.error("PostgreSQL connection error: ", err);
      process.exit(1);
    });
} else {
  console.log("Connecting to local SQLite database...");
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(__dirname, '..', 'reservations.db');
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error("SQLite opening error: ", err);
      process.exit(1);
    }
    console.log("Connected to SQLite successfully.");
    
    // Initialize SQLite table
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        country TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `, (err) => {
      if (err) {
        console.error("SQLite table creation error: ", err);
      } else {
        console.log("SQLite reservations table ready.");
      }
    });
  });
}

// POST endpoint to handle reservations
app.post('/api/reserve', (req, res) => {
  const { fullName, emailAddress, country } = req.body;
  
  if (!fullName || !emailAddress) {
    return res.status(400).json({ success: false, error: "Name and email are required." });
  }

  if (isPostgres) {
    const query = 'INSERT INTO reservations (name, email, country) VALUES ($1, $2, $3) RETURNING *';
    const values = [fullName, emailAddress, country || ''];
    pgClient.query(query, values)
      .then(result => {
        console.log("Saved to Postgres:", result.rows[0]);
        res.json({ success: true, entry: result.rows[0] });
      })
      .catch(err => {
        console.error("Postgres insertion error: ", err);
        res.status(500).json({ success: false, error: "Database save failed." });
      });
  } else {
    const query = 'INSERT INTO reservations (name, email, country) VALUES (?, ?, ?)';
    const values = [fullName, emailAddress, country || ''];
    
    sqliteDb.run(query, values, function(err) {
      if (err) {
        console.error("SQLite insertion error: ", err);
        return res.status(500).json({ success: false, error: "Database save failed." });
      }
      console.log("Saved to SQLite: ID =", this.lastID);
      res.json({
        success: true,
        entry: {
          id: this.lastID,
          name: fullName,
          email: emailAddress,
          country: country || ''
        }
      });
    });
  }
});

// GET endpoint to view reservations (for testing and convenience)
app.get('/api/reservations', (req, res) => {
  if (isPostgres) {
    pgClient.query('SELECT * FROM reservations ORDER BY created_at DESC')
      .then(result => {
        res.json(result.rows);
      })
      .catch(err => {
        console.error("Postgres retrieval error: ", err);
        res.status(500).json({ error: "Failed to retrieve reservations." });
      });
  } else {
    sqliteDb.all('SELECT * FROM reservations ORDER BY created_at DESC', [], (err, rows) => {
      if (err) {
        console.error("SQLite retrieval error: ", err);
        return res.status(500).json({ error: "Failed to retrieve reservations." });
      }
      res.json(rows);
    });
  }
});

// Start Express server locally (bypass in Serverless / Vercel runtime)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

module.exports = app;
