const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const axios = require("axios");

const JWT_SECRET = process.env.JWT_SECRET;
const BDD_SERVICE_URL = process.env.BDD_SERVICE_URL;
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL;

class AuthService {
  async login(email, password) {
    if (!email || !password) {
      throw new Error("Email et mot de passe requis");
    }

    // Récupérer l'utilisateur depuis le service BDD
    const userResponse = await axios.get(
      `${BDD_SERVICE_URL}/api/user/by-email/${encodeURIComponent(email)}`
    );

    if (!userResponse.data.success || !userResponse.data.data) {
      throw new Error("Identifiants invalides");
    }

    const user = userResponse.data.data;

    // Vérifier le mot de passe
    if (!user.password || !(await bcrypt.compare(password, user.password))) {
      throw new Error("Identifiants invalides");
    }

    // Générer le token JWT
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        typeAbonnement: user.typeAbonnement,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Retourner sans le mot de passe
    const { password: _, ...userWithoutPassword } = user;

    return {
      token,
      user: userWithoutPassword,
    };
  }

  async register(email, password, firstname, lastname) {
    if (!email || !password || !firstname || !lastname) {
      throw new Error("Tous les champs sont requis");
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur via le service BDD
    const userData = {
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      typeAbonnement: "free",
    };

    const userResponse = await axios.post(`${BDD_SERVICE_URL}/api/user`, userData);

    if (!userResponse.data.success) {
      throw new Error(userResponse.data.message || "Erreur lors de la création du compte");
    }

    const user = userResponse.data.data;

    // Envoyer l'email de bienvenue
    try {
      await axios.post(`${NOTIFICATION_SERVICE_URL}/api/email/welcome`, {
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
      });
    } catch (emailError) {
      console.error("Erreur envoi email de bienvenue:", emailError);
      // On continue même si l'email échoue
    }

    // Générer le token JWT
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        typeAbonnement: user.typeAbonnement,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Retourner sans le mot de passe
    const { password: _, ...userWithoutPassword } = user;
    console.log('Test token : ', token);
    return {
      token,
      user: userWithoutPassword,
    };
  }

  async getCurrentUser(token) {
    if (!token) {
      throw new Error("Token manquant");
    }

    // Validation du format du token
    if (typeof token !== 'string' || token.trim() === '') {
      throw new Error("Token invalide");
    }

    // Vérification du format JWT (3 parties séparées par des points)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      throw new Error("Token malformé");
    }

    try {
      // Vérifier et décoder le token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Vérifier que le token contient les informations nécessaires
      if (!decoded.id) {
        throw new Error("Token invalide - ID manquant");
      }

      // Récupérer les données utilisateur fraîches depuis la BDD
      const userResponse = await axios.get(`${BDD_SERVICE_URL}/api/user/${decoded.id}`);

      if (!userResponse.data.success) {
        throw new Error("Utilisateur non trouvé");
      }

      const { password: _, ...userWithoutPassword } = userResponse.data.data;

      return userWithoutPassword;
    } catch (error) {
      // Log pour debugging
      console.error("Erreur lors de la vérification du token:", error.message);
      console.error("Token reçu:", token);
      
      if (error.name === 'JsonWebTokenError') {
        throw new Error("Token invalide ou malformé");
      } else if (error.name === 'TokenExpiredError') {
        throw new Error("Token expiré");
      } else {
        throw error;
      }
    }
  }
}

module.exports = new AuthService();