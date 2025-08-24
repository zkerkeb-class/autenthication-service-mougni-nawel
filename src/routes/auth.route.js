const express = require("express")
const router = express.Router()
const authMiddleware = require("../middlewares/authMiddleware")
const { login, register, logout, me } = require("../controllers/auth.controller")

router.post("/login", login)
router.post("/register", register)
router.post("/logout", authMiddleware, logout)
router.get("/me", me)

module.exports = router
