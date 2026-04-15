const express = require("express");
const app = express();
const PORT = 3000;

// load dotenv
require("dotenv").config();

// import supabase
const { createClient } = require("@supabase/supabase-js");

// ambil dari .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// inisialisasi client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Root route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// core server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log("server lokal aktif");
});
