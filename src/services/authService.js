const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const User = require('../models/user');

const loginUser = async (email, password) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid password');
    }

    // Inclus le rôle de l'utilisateur dans le payload du token
    const token = jwt.sign(
      { id: user._id, email: user.email, typeAbonnement: user.typeAbonnement }, // Ajoute le rôle ici
      process.env.JWT_SECRET,
      { expiresIn: '6h' }
    );

    return {
      token,
      user
    };
  } catch (error) {
    logger.error('Error in loginUser:', error.message);
    throw error;
  }
};

const registerUser = async (firstname, lastname, email, password) => {
  try {
    console.log('tetee : ', email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      password: hashedPassword,
      typeAbonnement: 'free',
      firstname,
      lastname
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, typeAbonnement: newUser.typeAbonnement },
      process.env.JWT_SECRET,
      { expiresIn: '6h' }
    );

    return {
      token,
      newUser
    };
  } catch (error) {
    logger.error('Error in registerUser:', error.message);
    throw error;
  }
};

const getUserFromToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userFound = await User.findOne({_id: decoded.id});
    
    if (!userFound) {
      throw new Error('User not found');
    }
    
    return userFound;
  } catch (err) {
    console.error('Token verification error:', err.message);
    throw new Error('Invalid or expired token');
  }
};

module.exports = {
  loginUser,
  registerUser,
  getUserFromToken
};
