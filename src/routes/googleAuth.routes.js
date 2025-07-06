const express = require("express")
const router = express.Router()
const googleAuthController = require("../controllers/googleAuth.controller")

router.get("/google", googleAuthController.initiateAuth)
router.get("/google/callback", googleAuthController.handleCallback)

module.exports = router
