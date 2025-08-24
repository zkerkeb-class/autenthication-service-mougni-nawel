const passport = require('passport'); // Add this import
const { findOrCreateGoogleUser } = require('../services/googleAuthService');

const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await findOrCreateGoogleUser(profile);
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

module.exports = passport;