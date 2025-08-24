const jwt = require('jsonwebtoken')
const axios = require('axios')

const JWT_SECRET = process.env.JWT_SECRET
const BDD_SERVICE_URL = process.env.BDD_SERVICE_URL
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL
const FRONTEND_URL = process.env.FRONTEND_URL

const initiateAuth = (req, res) => {
  try {
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
    authUrl.searchParams.append("client_id", GOOGLE_CLIENT_ID)
    authUrl.searchParams.append("redirect_uri", GOOGLE_CALLBACK_URL)
    authUrl.searchParams.append("response_type", "code")
    authUrl.searchParams.append("scope", "email profile")
    authUrl.searchParams.append("access_type", "offline")

    res.redirect(authUrl.toString())
  } catch (error) {
    console.error("Erreur initiation Google OAuth:", error)
    res.status(500).json({
      success: false,
      message: "Erreur lors de la redirection vers Google",
    })
  }
}

const handleCallback = async (req, res) => {
  try {
    const { code, error: googleError } = req.query

    if (googleError) {
      return res.redirect(`${FRONTEND_URL}/login?error=auth_failed`)
    }

    if (!code) {
      return res.redirect(`${FRONTEND_URL}/login?error=no_code`)
    }

    // Échanger le code contre un token
    const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_CALLBACK_URL,
      grant_type: "authorization_code",
    })

    const { access_token } = tokenResponse.data

    // Récupérer les infos utilisateur
    const userInfoResponse = await axios.get(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`,
    )

    const googleUser = userInfoResponse.data
    let user

    try {
      // Chercher par Google ID
      const existingUserResponse = await axios.get(
        `${BDD_SERVICE_URL}/api/user/by-google-id/${googleUser.id}`,
      )

      if (existingUserResponse.data.success) {
        user = existingUserResponse.data.data
      } else {
        throw new Error("User not found")
      }
    } catch {
      try {
        // Chercher par email
        const emailUserResponse = await axios.get(
          `${BDD_SERVICE_URL}/api/user/by-email/${encodeURIComponent(googleUser.email)}`,
        )

        if (emailUserResponse.data.success) {
          // Mettre à jour avec Google ID
          const updateResponse = await axios.patch(
            `${BDD_SERVICE_URL}/api/user/${emailUserResponse.data.data._id}`,
            { googleId: googleUser.id },
          )
          user = updateResponse.data.data
        } else {
          throw new Error("User not found")
        }
      } catch {
        // Créer nouvel utilisateur
        const newUserResponse = await axios.post(`${BDD_SERVICE_URL}/api/user/google`, {
          googleId: googleUser.id,
          email: googleUser.email,
          firstname: googleUser.given_name || "Utilisateur",
          lastname: googleUser.family_name || "Google",
          typeAbonnement: "free",
        })
        user = newUserResponse.data.data
      }
    }

    // Générer JWT
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        typeAbonnement: user.typeAbonnement,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    )

    // Rediriger vers le frontend avec le token
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`)
  } catch (error) {
    console.error("Erreur callback Google:", error)
    res.redirect(`${FRONTEND_URL}/login?error=auth_failed`)
  }
}

module.exports = {
  initiateAuth,
  handleCallback
}
