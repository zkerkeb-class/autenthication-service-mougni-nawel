const express = require("express")
const router = express.Router()
const authRoutes = require("./auth.route")
const googleAuthRoutes = require("./googleAuth.routes")

router.use("/auth", authRoutes)
router.use("/googleAuth", googleAuthRoutes)

module.exports = router
