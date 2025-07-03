const authService = require('../services/authService');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const loginController = async (req, res) => {
  const { email, password } = req.body;
  try {
    const info = await authService.loginUser(email, password);
    const decoded = jwt.verify(info.token, process.env.JWT_SECRET);
    const sessionData = { id: decoded.id, email: decoded.email, typeAbonnement: decoded.typeAbonnement };
    logger.info('Calling setSession with token:', info.token, 'and data:', sessionData);
    res.status(200).json({ info });
  } catch (error) {
    logger.error('Erreur lors du login:', error.message);
    res.status(400).json({ message: error.message });
  }
};

const registerController = async (req, res) => {
  console.log('y : ', req.body)
  const { email, password, firstname, lastname } = req.body.user;
  try {
    const info = await authService.registerUser(email, password, firstname, lastname);
    const decoded = jwt.verify(info.token, process.env.JWT_SECRET);
    const sessionData = { id: decoded.id, email: decoded.email, typeAbonnement: decoded.typeAbonnement };
    logger.info('Calling setSession with token:', info.token, 'and data:', sessionData);
    res.status(201).json({ info });
  } catch (error) {
    logger.error('Erreur lors de l’enregistrement:', error.message);
    res.status(400).json({ message: error.message });
  }
};

const meController = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const user = await authService.getUserFromToken(token);
    console.log('tests : ', user);
    res.status(200).json(user);
  } catch (error) {
    logger.error('Erreur lors de la récupération du profil:', error.message);
    res.status(401).json({ message: 'Unauthorized' });
  }
};


const logoutController = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(400).json({ message: 'Token manquant.' });
  }

  try {

    res.status(200).json({ message: 'Déconnexion réussie.' });
  } catch (error) {
    logger.error('Erreur lors de la déconnexion:', error.message);
    res.status(500).json({ message: 'Erreur interne lors de la déconnexion.' });
  }
};

module.exports = {
  loginController,
  logoutController,
  registerController,
  meController
};
