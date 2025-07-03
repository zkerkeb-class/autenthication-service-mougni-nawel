const express = require('express');
const fetch = require('node-fetch').default;
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/user');
const router = express.Router();

// Environment variables
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  FRONTEND_URL = 'http://localhost:3000',
  JWT_SECRET
} = process.env;

const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALLBACK_URL = 'http://localhost:8010/api/googleAuth/google/callback';

// Initiate Google OAuth
router.get('/google', (req, res) => {
  try {
    const authUrl = new URL(GOOGLE_OAUTH_URL);
    authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', GOOGLE_CALLBACK_URL);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'email profile');
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('state', 'some_state');
    
    console.log('Redirecting to:', authUrl.toString());
    res.redirect(authUrl.toString());
  } catch (error) {
    console.error('Error in Google auth initiation:', error);
    res.status(500).json({ error: 'Failed to initiate Google auth' });
  }
});

// Handle Google callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code, error: googleError } = req.query;
    
    if (googleError) {
      throw new Error(`Google auth failed: ${googleError}`);
    }

    if (!code) {
      throw new Error('Authorization code missing');
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(`Token exchange failed: ${errorData.error}`);
    }

    const { id_token } = await tokenResponse.json();

    // Verify ID token
    const userInfoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`);
    if (!userInfoResponse.ok) {
      throw new Error('Failed to verify ID token');
    }

    const userInfo = await userInfoResponse.json();
    console.log('Authenticated user:', userInfo.email);

    // Find or create user
    let user = await User.findOne({ email: userInfo.email });
    if (!user) {
      user = await User.create({
        googleId: userInfo.sub,
        email: userInfo.email,
        firstname: userInfo.given_name || 'Google',
        lastname: userInfo.family_name || 'User',
        typeAbonnement: 'free'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '6h' }
    );

    // Redirect to frontend
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);

  } catch (error) {
    console.error('Google auth error:', error);
    res.redirect(`${FRONTEND_URL}/login?error=auth_failed&message=${encodeURIComponent(error.message)}`);
  }
});

module.exports = router;