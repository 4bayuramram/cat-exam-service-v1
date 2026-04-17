const express = require("express");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// register manual
router.post("/register", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: "Data tidak lengkap" });
  }

  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        email,
        password, // kalau mau aman, hash dulu pakai bcrypt
        name,
      },
    ])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json({ message: "Register berhasil", user: data });
});

module.exports = router;
