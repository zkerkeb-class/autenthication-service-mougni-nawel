const jwt = require("jsonwebtoken")
const axios = require("axios")

const JWT_SECRET = process.env.JWT_SECRET
const BDD_SERVICE_URL = process.env.BDD_SERVICE_URL

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization && req.headers.authorization.split(" ")[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token d'authentification requis",
      })
    }

    // Vérifier le token JWT
    const decoded = jwt.verify(token, JWT_SECRET)

    console.log('OOO : ', decoded);
    // Récupérer l'utilisateur depuis la BDD
    const userResponse = await axios.get(`${BDD_SERVICE_URL}/api/user/${decoded.id}`, {
      timeout: 5000,
      validateStatus: (status) => status < 500,
    })

    if (!userResponse.data.success || !userResponse.data.data) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non trouvé",
      })
    }

    req.user = userResponse.data.data
    next()
  } catch (error) {
    console.error("Erreur middleware auth:", error)

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expiré",
      })
    }

    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({
        success: false,
        message: "Service d'authentification indisponible",
      })
    }

    res.status(401).json({
      success: false,
      message: "Token invalide",
    })
  }
}

module.exports = authMiddleware
