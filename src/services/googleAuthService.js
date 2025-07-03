const jwt = require('jsonwebtoken');
const User = require('../models/user')(require('mongoose'));
const logger = require('../utils/logger');

const findOrCreateGoogleUser = async (googleProfile) => {
  console.log('Creating user with profile:', googleProfile); // Debug log
  try {
    const existingUser = await User.findOne({ googleId: googleProfile.id });
    console.log('Existing user:', existingUser); // Debug log
    
    if (!existingUser) {
      const newUser = new User({
        googleId: googleProfile.id,
        email: googleProfile.emails[0].value,
        firstname: googleProfile.name.givenName,
        lastname: googleProfile.name.familyName
      });
      await newUser.save();
      console.log('New user created:', newUser); // Debug log
      return newUser;
    }
    return existingUser;
  } catch (error) {
    console.error('Error in user creation:', error);
    throw error;
  }
};
const generateTokenForGoogleUser = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, typeAbonnement: user.typeAbonnement },
    process.env.JWT_SECRET,
    { expiresIn: '6h' }
  );
};

module.exports = { findOrCreateGoogleUser, generateTokenForGoogleUser };
