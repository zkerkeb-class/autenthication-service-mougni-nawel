const { login, register, me, logout } = require('../../src/controllers/auth.controller');
const authService = require('../../src/services/authService');

jest.mock('../../src/services/authService');

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  describe('login', () => {
    beforeEach(() => {
      req.body = { email: 'test@test.com', password: 'password' };
    });

    it('should return success response when login is successful', async () => {
      const mockResult = { token: 'token123', user: { id: '123', email: 'test@test.com' } };
      authService.login.mockResolvedValue(mockResult);

      await login(req, res);

      expect(authService.login).toHaveBeenCalledWith('test@test.com', 'password');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('should return 401 for invalid credentials', async () => {
      authService.login.mockRejectedValue(new Error('Identifiants invalides'));

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Identifiants invalides'
      });
    });

    it('should return 401 for missing fields', async () => {
      authService.login.mockRejectedValue(new Error('Email et mot de passe requis'));

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email et mot de passe requis'
      });
    });

    it('should return 500 for server errors', async () => {
      authService.login.mockRejectedValue(new Error('Database connection failed'));

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Erreur serveur lors de la connexion'
      });
    });
  });

  describe('register', () => {
    beforeEach(() => {
      req.body = {
        user: {
          email: 'test@test.com',
          password: 'password',
          firstname: 'John',
          lastname: 'Doe'
        }
      };
    });

    it('should return success response when registration is successful', async () => {
      const mockResult = { token: 'token123', user: { id: '123', email: 'test@test.com' } };
      authService.register.mockResolvedValue(mockResult);

      await register(req, res);

      expect(authService.register).toHaveBeenCalledWith('test@test.com', 'password', 'John', 'Doe');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: "Compte créé avec succès ! Un email de bienvenue vous a été envoyé."
      });
    });

    it('should return 409 for existing email', async () => {
      const error = new Error('Email already exists');
      error.response = { status: 409 };
      authService.register.mockRejectedValue(error);

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Un compte avec cet email existe déjà"
      });
    });

    it('should return 400 for missing required fields', async () => {
      authService.register.mockRejectedValue(new Error('Tous les champs sont requis'));

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Tous les champs sont requis'
      });
    });

    it('should return 500 for server errors', async () => {
      authService.register.mockRejectedValue(new Error('Database error'));

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Erreur serveur lors de la création du compte'
      });
    });
  });

  describe('me', () => {
    it('should return user data with valid token', async () => {
      req.headers.authorization = 'Bearer valid-token';
      const mockUser = { id: '123', email: 'test@test.com' };
      authService.getCurrentUser.mockResolvedValue(mockUser);

      await me(req, res);

      expect(authService.getCurrentUser).toHaveBeenCalledWith('valid-token');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser
      });
    });

    it('should return 401 if no authorization header', async () => {
      await me(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token manquant - En-tête Authorization requis'
      });
    });

    it('should return 401 if no token in Bearer format', async () => {
      req.headers.authorization = 'Bearer ';

      await me(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token manquant - Format Bearer token requis'
      });
    });

    it('should return 401 for expired token', async () => {
      req.headers.authorization = 'Bearer expired-token';
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      authService.getCurrentUser.mockRejectedValue(error);

      await me(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token expiré'
      });
    });

    it('should return 401 for invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token';
      authService.getCurrentUser.mockRejectedValue(new Error('Token invalide'));

      await me(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token invalide'
      });
    });
  });

  describe('logout', () => {
    it('should return success message', async () => {
      await logout(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Déconnexion réussie'
      });
    });
  });
});