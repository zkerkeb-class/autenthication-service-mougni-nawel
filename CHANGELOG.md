# Changelog - Auth Service

## 1.0.0
- Version stable du service d’authentification.
- Routes : login, register, me, logout.
- Gestion des tokens JWT.
- Tests unitaires sur les contrôleurs (Jest).
- Intégration CI/CD (tests + build + push Docker).

## 0.3.0
- Mise en place du pipeline GitHub Actions.
- Création du fichier `.env.dev` à partir des secrets GitHub.
- Construction et push des images Docker sur GHCR.

## 0.2.0
- Ajout des tests unitaires sur les contrôleurs Auth.
- Création de la branche `tests`.
- Correction de bugs (token, routes).

## 0.1.0
- Initialisation du projet Auth.
- Configuration Express.
- Création des premières routes de login/register.
