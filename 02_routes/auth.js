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
      try {
        const google_id = profile.id;
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const avatar = profile.photos?.[0]?.value;

        // 1. cek berdasarkan google_id
        let { data: user, error } = await supabase
          .from("users")
          .select("*")
          .eq("google_id", google_id)
          .single();

        if (error && error.code !== "PGRST116") {
          return done(error, null);
        }

        // 2. jika tidak ada, cek berdasarkan email
        if (!user) {
          const { data: existingUser, error: emailError } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .single();

          if (emailError && emailError.code !== "PGRST116") {
            return done(emailError, null);
          }

          // 3. jika email sudah ada → update jadi akun Google
          if (existingUser) {
            const { data: updatedUser, error: updateError } = await supabase
              .from("users")
              .update({
                google_id,
                name,
                avatar,
                updated_at: new Date(),
              })
              .eq("id", existingUser.id)
              .select("*")
              .single();

            if (updateError) return done(updateError, null);

            return done(null, updatedUser);
          }

          // 4. jika user baru → insert
          const { data: newUser, error: insertError } = await supabase
            .from("users")
            .insert([
              {
                google_id,
                email,
                name,
                password: null,
                avatar,
              },
            ])
            .select("*")
            .single();

          if (insertError) return done(insertError, null);

          return done(null, newUser);
        }

        // 5. jika user sudah ada → update data terbaru
        const { data: updatedUser, error: updateError } = await supabase
          .from("users")
          .update({
            email,
            name,
            avatar,
            updated_at: new Date(),
          })
          .eq("id", user.id)
          .select("*")
          .single();

        if (updateError) return done(updateError, null);

        return done(null, updatedUser);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// serialize user (simpan id ke session)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// deserialize user (ambil semua kolom dari DB)
passport.deserializeUser(async (id, done) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

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

// Route login Google
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Callback Google
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/dashboard");
  }
);

// Dashboard
router.get("/dashboard", (req, res) => {
  if (!req.user) {
    return res.redirect("/");
  }

  res.send(`
    <h1>Dashboard</h1>
    <p>ID: ${req.user.id}</p>
    <p>Google ID: ${req.user.google_id}</p>
    <p>Email: ${req.user.email}</p>
    <p>Name: ${req.user.name}</p>
    <p>Avatar: <img src="${req.user.avatar}" width="50"/></p>
    <p>Created At: ${req.user.created_at}</p>
    <p>Updated At: ${req.user.updated_at}</p>
  `);
});

module.exports = router;