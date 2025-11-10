const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'chinmay_mysql_pass',
  database: 'project'
};

const PORT = 3001;
const TABLE_NAME = 'mobile';
const OPTIONS_FILE = 'filter_options.json';

// Load filter options
let filterOptions = {};
try {
  const data = fs.readFileSync(OPTIONS_FILE, 'utf8');
  filterOptions = JSON.parse(data);
} catch (err) {
  console.error('Error reading filter_options.json:', err);
}

// --- Register User ---
app.post('/api/register', async (req, res) => {
  const { userID, password } = req.body;
  if (!userID || !password)
    return res.status(400).json({ error: 'userID and password required' });

  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('INSERT INTO login (userID, password) VALUES (?, ?)', [userID, password]);
    res.json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'User registration failed (maybe duplicate userID)' });
  }
});

// --- Login User ---
app.post('/api/login', async (req, res) => {
  const { userID, password } = req.body;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM login WHERE userID = ?', [userID]);

    if (rows.length === 0)
      return res.status(401).json({ error: 'Invalid userID' });

    const user = rows[0];
    if (user.password !== password)
      return res.status(401).json({ error: 'Invalid password' });

    res.json({ success: true, message: 'Login successful', userID });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// --- Get Filter Options ---
app.get('/api/mobile/options', (req, res) => {
  if (Object.keys(filterOptions).length === 0)
    return res.status(500).json({ error: 'Filter options not loaded.' });
  res.json(filterOptions);
});

// --- Filtered Mobiles ---
app.get('/api/mobile/filter', async (req, res) => {
  const filters = req.query;
  let sql = `SELECT * FROM ${TABLE_NAME}`;
  const conditions = [];
  const values = [];

  if (filters.Brand) { conditions.push(`Brand = ?`); values.push(filters.Brand); }
  if (filters.RAM) { conditions.push(`RAM = ?`); values.push(parseFloat(filters.RAM)); }
  if (filters.Front_Camera) { conditions.push(`Front_Camera = ?`); values.push(filters.Front_Camera); }
  if (filters.Back_Camera) { conditions.push(`Back_Camera = ?`); values.push(filters.Back_Camera); }
  if (filters.Processor) { conditions.push(`Processor = ?`); values.push(filters.Processor); }
  if (filters.Launched_Year) { conditions.push(`Launched_Year = ?`); values.push(parseInt(filters.Launched_Year)); }
  if (filters.Model) { conditions.push(`Model LIKE ?`); values.push(`%${filters.Model}%`); }
  if (filters.min_Price) { conditions.push(`Price >= ?`); values.push(parseInt(filters.min_Price)); }
  if (filters.max_Price) { conditions.push(`Price <= ?`); values.push(parseInt(filters.max_Price)); }
  if (filters.min_Battery_Capacity) { conditions.push(`Battery_Capacity >= ?`); values.push(parseInt(filters.min_Battery_Capacity)); }
  if (filters.max_Battery_Capacity) { conditions.push(`Battery_Capacity <= ?`); values.push(parseInt(filters.max_Battery_Capacity)); }
  if (filters.min_Mobile_Weight) { conditions.push(`Mobile_Weight >= ?`); values.push(parseFloat(filters.min_Mobile_Weight)); }
  if (filters.max_Mobile_Weight) { conditions.push(`Mobile_Weight <= ?`); values.push(parseFloat(filters.max_Mobile_Weight)); }
  if (filters.min_Screen_Size) { conditions.push(`Screen_Size >= ?`); values.push(parseFloat(filters.min_Screen_Size)); }
  if (filters.max_Screen_Size) { conditions.push(`Screen_Size <= ?`); values.push(parseFloat(filters.max_Screen_Size)); }

  if (conditions.length > 0) sql += ` WHERE ` + conditions.join(' AND ');
  sql += ` ORDER BY Price ASC`;

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(sql, values);
    res.json(rows);
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Failed to retrieve data' });
  }
});

// --- Get Liked Mobiles for a user ---
app.get('/api/mobile/favorites', async (req, res) => {
  const userID = req.query.userID;
  if (!userID) return res.status(400).json({ error: 'userID required' });

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
      SELECT m.* 
      FROM liked_mobiles l 
      JOIN mobile m ON l.mobileId = m.id 
      WHERE l.userID = ?
      ORDER BY l.timestamp DESC
    `, [userID]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// --- Toggle Like/Unlike for a user ---
app.post('/api/mobile/like', async (req, res) => {
  const { mobileId, userID, isLiked } = req.body;
  if (!userID || !mobileId) return res.status(400).json({ error: 'userID and mobileId required' });

  try {
    const connection = await mysql.createConnection(dbConfig);
    if (isLiked) {
      await connection.execute('INSERT INTO liked_mobiles (userID, mobileId) VALUES (?, ?)', [userID, mobileId]);
    } else {
      await connection.execute('DELETE FROM liked_mobiles WHERE userID = ? AND mobileId = ?', [userID, mobileId]);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Toggle like failed:', error);
    res.status(500).json({ error: 'Failed to update like status' });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
