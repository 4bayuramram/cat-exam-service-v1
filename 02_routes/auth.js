const express = require("express");
const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const cookieSession = require("cookie-session");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const router = express.Router();

// inisialisasi client supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Passport.js configuration
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      // Verifikasi atau simpan user ke dalam database (Supabase)
      const { data, error } = await supabase
        .from("users")
        .upsert([
          {
            google_id: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            avatar: profile.photos[0].value,
          },
        ])
        .single();

      if (error) {
        return done(error, null);
      }

      return done(null, data);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const { data, error } = await supabase.from("users").select("*").eq("id", id).single();
  if (error) {
    return done(error, null);
  }
  done(null, data);
});

// Middleware untuk session
router.use(
  cookieSession({
    name: "session",
    keys: [process.env.SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })
);

router.use(passport.initialize());
router.use(passport.session());

// Route untuk login dengan Google
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Callback route setelah login dengan Google
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/dashboard"); // Redirect ke halaman dashboard setelah login berhasil
  }
);

// Route untuk dashboard
router.get("/dashboard", (req, res) => {
  if (!req.user) {
    return res.redirect("/"); // Jika user belum login, redirect ke halaman utama
  }
  res.send(`Welcome to the dashboard, ${req.user.name}`);
});

module.exports = router;