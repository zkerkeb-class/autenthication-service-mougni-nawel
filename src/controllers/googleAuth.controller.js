// controllers/googleAuth.controller.js
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const authService = require('../services/googleAuthService');

const googleAuthCallback = async (req, res) => {
    console.log('lol : ')

  try {
    const user = req.user;

    // Génére le token
    const token = authService.generateTokenForGoogleUser(user);

    logger.info('Google Auth Successful for user:', user.email);

    // Redirige vers le frontend avec le token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    logger.error('Google Auth Error:', error.message);
    res.redirect('/login'); // Tu peux personnaliser cette redirection
  }
};

module.exports = { googleAuthCallback };
