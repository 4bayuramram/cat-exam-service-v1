const express = require("express");
const app = express();
const PORT = 3000;

// load dotenv
require("dotenv").config({ path: "../.env" });

// import supabase
const { createClient } = require("@supabase/supabase-js");

// ambil dari .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// inisialisasi client Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Import routes
const authRoutes = require("../02_routes/auth");

//import register
const registerRoutes = require("../02_routes/register");



// Middleware untuk parsing JSON, jika diperlukan
app.use(express.json());

// Middleware untuk parsing form data, jika diperlukan
app.use(express.urlencoded({ extended: true }));

// Gunakan route auth
app.use("/auth", authRoutes);

//gunakan routes register 
app.use("/auth", registerRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});



