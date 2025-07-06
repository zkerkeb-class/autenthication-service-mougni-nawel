const authService = require("../services/authService");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Erreur login:", error);
    
    if (error.message === "Email et mot de passe requis" || 
        error.message === "Identifiants invalides") {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la connexion",
    });
  }
};

const register = async (req, res) => {
  try {
    const { email, password, firstname, lastname } = req.body.user;
    console.log('test : ', req.body)
    const result = await authService.register(email, password, firstname, lastname);

    res.status(201).json({
      success: true,
      data: result,
      message: "Compte créé avec succès ! Un email de bienvenue vous a été envoyé.",
    });
  } catch (error) {
    console.error("Erreur register:", error);

    if (error.response && error.response.status === 409) {
      return res.status(409).json({
        success: false,
        message: "Un compte avec cet email existe déjà",
      });
    }

    if (error.message === "Tous les champs sont requis") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création du compte",
    });
  }
};

const me = async (req, res) => {
  try {
    // Récupération et validation du token
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Token manquant - En-tête Authorization requis",
      });
    }

    const token = authHeader.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token manquant - Format Bearer token requis",
      });
    }

    // Log pour debugging
    console.log("Token reçu:", token.substring(0, 20) + "...");
    
    const user = await authService.getCurrentUser(token);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Erreur me:", error);

    if (error.name === "TokenExpiredError" || error.message === "Token expiré") {
      return res.status(401).json({
        success: false,
        message: "Token expiré",
      });
    }

    if (error.message === "Token manquant" || 
        error.message === "Utilisateur non trouvé" ||
        error.message === "Token invalide" ||
        error.message === "Token malformé" ||
        error.message === "Token invalide ou malformé") {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    res.status(401).json({
      success: false,
      message: "Token invalide",
    });
  }
};

const logout = async (req, res) => {
  res.json({
    success: true,
    message: "Déconnexion réussie",
  });
};

module.exports = {
  login,
  register,
  me,
  logout,
};