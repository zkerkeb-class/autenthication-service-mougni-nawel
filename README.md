# Authentication Service

Service d'authentification et autorisation.

## Description

Microservice centralisé gérant l'authentification, l'autorisation et la gestion des utilisateurs.

## Fonctionnalités principales

- Authentification JWT
- Gestion des rôles et permissions
- OAuth2 (Google)

## Technologies

- Node.js / Express
- JWT (JSON Web Tokens)
- bcrypt (hachage mots de passe)
- MongoDB

## Endpoints principaux

- `POST /auth/login` - Connexion utilisateur
- `POST /auth/register` - Inscription
- `POST /auth/refresh` - Renouvellement token
- `POST /auth/logout` - Déconnexion

---
**Développé par MOUGNI Nawel**
