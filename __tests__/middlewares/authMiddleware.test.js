const authMiddleware = require('../../src/middlewares/authMiddleware');
const jwt = require('jsonwebtoken');
const axios = require('axios');

jest.mock('jsonwebtoken');
jest.mock('axios');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();

    process.env.JWT_SECRET = 'secret';
    process.env.BDD_SERVICE_URL = 'http://bdd:8000';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.BDD_SERVICE_URL;
  });

  describe('Token validation', () => {
    it('should return 401 if no authorization header', async () => {
      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Token d'authentification requis"
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if no token in Bearer format', async () => {
      req.headers.authorization = 'Bearer ';

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Token d'authentification requis"
      });
    });

    it('should return 401 if invalid token format', async () => {
      req.headers.authorization = 'InvalidFormat token123';
      jwt.verify.mockImplementation(() => {
        const error = new Error('invalid token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Token invalide"
      });
    });
  });

  describe('JWT verification', () => {
    it('should return 401 if token is expired', async () => {
      req.headers.authorization = 'Bearer expired-token';
      jwt.verify.mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Token expiré"
      });
    });

    it('should return 401 if token is invalid', async () => {
      req.headers.authorization = 'Bearer invalid-token';
      jwt.verify.mockImplementation(() => {
        const error = new Error('invalid signature');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Token invalide"
      });
    });
  });

  describe('User validation', () => {
    beforeEach(() => {
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ id: '123' });
    });

    it('should return 401 if user not found', async () => {
      axios.get.mockResolvedValue({
        data: { success: false }
      });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Utilisateur non trouvé"
      });
    });

    it('should return 503 if database service is unavailable', async () => {
      const error = new Error('Connection refused');
      error.code = 'ECONNREFUSED';
      axios.get.mockRejectedValue(error);

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Service d'authentification indisponible"
      });
    });

    it('should call next() with valid token and user', async () => {
      const userData = { _id: '123', email: 'test@test.com' };
      axios.get.mockResolvedValue({
        data: { success: true, data: userData }
      });

      await authMiddleware(req, res, next);

      expect(req.user).toEqual(userData);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should make request to correct endpoint with timeout', async () => {
      const userData = { _id: '123', email: 'test@test.com' };
      axios.get.mockResolvedValue({
        data: { success: true, data: userData }
      });

      await authMiddleware(req, res, next);

      expect(axios.get).toHaveBeenCalledWith(
        `${process.env.BDD_SERVICE_URL}/api/user/123`,
        {
          timeout: 5000,
          validateStatus: expect.any(Function)
        }
      );
    });
  });
});