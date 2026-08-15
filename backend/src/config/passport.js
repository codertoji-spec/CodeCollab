const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const pool = require('./db');

passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];
      if (!user) return done(null, false, { message: 'Invalid email or password' });
      if (!user.password_hash) return done(null, false, { message: 'Please use Google sign-in for this account' });
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return done(null, false, { message: 'Invalid email or password' });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here') {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const avatarUrl = profile.photos[0]?.value;
        let result = await pool.query('SELECT * FROM users WHERE google_id = $1', [profile.id]);
        if (result.rows[0]) return done(null, result.rows[0]);
        result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows[0]) {
          await pool.query('UPDATE users SET google_id = $1, avatar_url = $2 WHERE email = $3', [profile.id, avatarUrl, email]);
          result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
          return done(null, result.rows[0]);
        }
        const username = profile.displayName.replace(/\s+/g, '_').toLowerCase() + '_' + Math.random().toString(36).substr(2, 4);
        const newUser = await pool.query(
          'INSERT INTO users (username, email, google_id, avatar_url, is_verified) VALUES ($1, $2, $3, $4, true) RETURNING *',
          [username, email, profile.id, avatarUrl]
        );
        const user = newUser.rows[0];
        user.isNewGoogleUser = true;
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
