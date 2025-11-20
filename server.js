const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const fs = require("fs");
// const fetch = require("node-fetch"); 

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "chinmay_mysql_pass", 
  database: "project",
};

const PORT = 3001;
// New port for the separate Python AI service
const AI_SERVICE_URL = "http://localhost:5000/generate_summary"; 
const TABLE_NAME = "mobile";
const OPTIONS_FILE = "filter_options.json";

// --- Load filter options from file ---
let filterOptions = {};
try {
  const data = fs.readFileSync(OPTIONS_FILE, "utf8");
  filterOptions = JSON.parse(data);
} catch (err) {
  console.error("Error reading filter_options.json:", err);
}

// --- Register User ---
app.post("/api/register", async (req, res) => {
  const { userID, password, name } = req.body;
  if (!userID || !password || !name)
    return res
      .status(400)
      .json({ error: "Name, userID, and password are required" });

  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      "INSERT INTO login (userID, password, name) VALUES (?, ?, ?)",
      [userID, password, name]
    );
    res.json({ success: true, message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res
      .status(500)
      .json({ error: "User registration failed (maybe duplicate userID)" });
  }
});

// --- Login User ---
app.post("/api/login", async (req, res) => {
  const { userID, password } = req.body;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT * FROM login WHERE userID = ?",
      [userID]
    );

    if (rows.length === 0)
      return res.status(401).json({ error: "Invalid userID" });

    const user = rows[0];
    if (user.password !== password)
      return res.status(401).json({ error: "Invalid password" });

    res.json({
      success: true,
      message: "Login successful",
      userID,
      name: user.name,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// --- Get Filter Options ---
app.get("/api/mobile/options", (req, res) => {
  if (Object.keys(filterOptions).length === 0)
    return res.status(500).json({ error: "Filter options not loaded." });
  res.json(filterOptions);
});

// --- Get Filtered Mobiles ---
app.get("/api/mobile/filter", async (req, res) => {
  const filters = req.query;
  let sql = `SELECT * FROM ${TABLE_NAME}`;
  const conditions = [];
  const values = [];

  if (filters.Brand) {
    conditions.push(`Brand = ?`);
    values.push(filters.Brand);
  }
  if (filters.RAM) {
    conditions.push(`RAM = ?`);
    values.push(parseFloat(filters.RAM));
  }
  if (filters.Front_Camera) {
    conditions.push(`Front_Camera = ?`);
    values.push(filters.Front_Camera);
  }
  if (filters.Back_Camera) {
    conditions.push(`Back_Camera = ?`);
    values.push(filters.Back_Camera);
  }
  if (filters.Processor) {
    conditions.push(`Processor = ?`);
    values.push(filters.Processor);
  }
  if (filters.Launched_Year) {
    conditions.push(`Launched_Year = ?`);
    values.push(parseInt(filters.Launched_Year));
  }
  if (filters.Model) {
    conditions.push(`Model LIKE ?`);
    values.push(`%${filters.Model}%`);
  }
  if (filters.min_Price) {
    conditions.push(`Price >= ?`);
    values.push(parseInt(filters.min_Price));
  }
  if (filters.max_Price) {
    conditions.push(`Price <= ?`);
    values.push(parseInt(filters.max_Price));
  }
  if (filters.min_Battery_Capacity) {
    conditions.push(`Battery_Capacity >= ?`);
    values.push(parseInt(filters.min_Battery_Capacity));
  }
  if (filters.max_Battery_Capacity) {
    conditions.push(`Battery_Capacity <= ?`);
    values.push(parseInt(filters.max_Battery_Capacity));
  }
  if (filters.min_Mobile_Weight) {
    conditions.push(`Mobile_Weight >= ?`);
    values.push(parseFloat(filters.min_Mobile_Weight));
  }
  if (filters.max_Mobile_Weight) {
    conditions.push(`Mobile_Weight <= ?`);
    values.push(parseFloat(filters.max_Mobile_Weight));
  }
  if (filters.min_Screen_Size) {
    conditions.push(`Screen_Size >= ?`);
    values.push(parseFloat(filters.min_Screen_Size));
  }
  if (filters.max_Screen_Size) {
    conditions.push(`Screen_Size <= ?`);
    values.push(parseFloat(filters.max_Screen_Size));
  }

  if (conditions.length > 0) sql += ` WHERE ` + conditions.join(" AND ");
  sql += ` ORDER BY Price ASC`;

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(sql, values);
    res.json(rows);
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({ error: "Failed to retrieve data" });
  }
});

// --- NEW ENDPOINT: AI Summary ---
app.post("/api/mobile/summary", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  console.log("Forwarding prompt to AI service:", prompt);

  try {
    // Forward the prompt to the Python AI Service
    const aiResponse = await fetch(AI_SERVICE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`AI Service failed with status ${aiResponse.status}: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    // aiData is expected to be { summary: "..." }
    res.json(aiData); 

  } catch (error) {
    console.error("Error communicating with AI service:", error.message);
    res.status(500).json({ error: "Failed to get AI Summary from service." });
  }
});

// --- Get Liked Mobiles for a User ---
app.get("/api/mobile/favorites", async (req, res) => {
  const userID = req.query.userID;
  if (!userID) return res.status(400).json({ error: "userID required" });

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `
      SELECT m.* FROM liked_mobiles l 
      JOIN mobile m ON l.mobileId = m.id 
      WHERE l.userID = ?
      ORDER BY l.timestamp DESC
    `,
      [userID]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
});

// --- Toggle Like/Unlike ---
app.post("/api/mobile/like", async (req, res) => {
  const { mobileId, userID, isLiked } = req.body;
  if (!userID || !mobileId)
    return res.status(400).json({ error: "userID and mobileId required" });

  try {
    const connection = await mysql.createConnection(dbConfig);
    if (isLiked) {
      await connection.execute(
        "INSERT INTO liked_mobiles (userID, mobileId) VALUES (?, ?)",
        [userID, mobileId]
      );
    } else {
      await connection.execute(
        "DELETE FROM liked_mobiles WHERE userID = ? AND mobileId = ?",
        [userID, mobileId]
      );
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Toggle like failed:", error);
    res.status(500).json({ error: "Failed to update like status" });
  }
});

// --- CORRECTED Get User Name Route ---
app.get("/api/user", async (req, res) => {
  const { userID } = req.query;
  if (!userID) return res.status(400).json({ message: "userID is required" });
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT name FROM login WHERE userID = ?",
      [userID]
    );
    
    if (rows.length > 0) res.json(rows[0]); // Returns { name: "..." }
    else res.status(404).json({ message: "User not found" });
  } catch (err) {
    console.error("Error fetching user name:", err);
    res.status(500).json({ message: "Database error" });
  }
});

app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);