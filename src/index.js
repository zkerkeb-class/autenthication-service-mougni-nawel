const express = require("express")
const helmet = require("helmet")
const timeout = require("express-timeout-handler")
const cors = require("cors")
const path = require("path")
require("dotenv").config({ path: path.resolve(__dirname, "../.env.dev") })

const routes = require("./routes")
const { initializeMetrics, metricsRouter, metricsMiddleware } = require("./utils/metrics")
const logger = require("./utils/logger")

const app = express()
const PORT = process.env.PORT

// Middlewares de sécurité
app.use(helmet())

// Set up CORS options
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}

// Enable CORS
app.use(cors(corsOptions))

// Middlewares de parsing
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// 🔧 INITIALISATION DES MÉTRIQUES (OBLIGATOIRE)
initializeMetrics()

// 📊 MIDDLEWARE MÉTRIQUES (avant les autres middlewares)
app.use(metricsMiddleware)

// 🛣️ ROUTES MÉTRIQUES
app.use(metricsRouter)

// Routes
app.use("/api", routes)

// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "auth-service",
    timestamp: new Date().toISOString(),
  })
})

// Timeout middleware
app.use(
  timeout.handler({
    timeout: 10000,
    onTimeout: (res) => {
      res.status(503).json({ error: "Requête expirée, veuillez réessayer plus tard." })
    },
    disable: ["write", "setHeaders"],
  }),
)

// Gestion d'erreur globale avec métriques
app.use((err, req, res, next) => {
  const { recordError } = require("./utils/metrics")
  recordError("unhandled_error", err)
  logger.error("Erreur non gérée:", err)
  res.status(500).json({ error: "Internal Server Error" })
})


// Démarrage du serveur
app.listen(PORT, () => {
  logger.info(`🚀 Auth Service démarré sur le port ${PORT}`)
})

// Graceful shutdown
process.on("SIGINT", async () => {
  try {
    logger.info("Auth Service fermé proprement")
    process.exit(0)
  } catch (error) {
    logger.error("Erreur lors de la fermeture:", error)
    process.exit(1)
  }
})

module.exports = app
