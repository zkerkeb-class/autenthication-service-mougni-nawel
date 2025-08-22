const AuthService = require('../../src/services/authService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');

jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('axios');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BDD_SERVICE_URL = 'http://bdd:8000';
    process.env.NOTIFICATION_SERVICE_URL = 'http://notification:8016';
    console.error = jest.fn();
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.BDD_SERVICE_URL;
    delete process.env.NOTIFICATION_SERVICE_URL;
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        _id: '123',
        email: 'test@test.com',
        password: 'hashedpassword',
        typeAbonnement: 'free'
      };

      axios.get.mockResolvedValue({
        data: { success: true, data: mockUser }
      });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('token123');

      const result = await AuthService.login('test@test.com', 'password');

      expect(axios.get).toHaveBeenCalledWith(
        `${process.env.BDD_SERVICE_URL}/api/user/by-email/test%40test.com`
      );
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedpassword');
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: '123',
          email: 'test@test.com',
          typeAbonnement: 'free'
        },
        'secret',
        { expiresIn: '24h' }
      );
      expect(result.token).toBe('token123');
      expect(result.user).toEqual({
        _id: '123',
        email: 'test@test.com',
        typeAbonnement: 'free'
      });
    });

    it('should throw error if email or password missing', async () => {
      await expect(AuthService.login('', 'password')).rejects.toThrow('Email et mot de passe requis');
      await expect(AuthService.login('test@test.com', '')).rejects.toThrow('Email et mot de passe requis');
    });

    it('should throw error if user not found', async () => {
      axios.get.mockResolvedValue({
        data: { success: false }
      });

      await expect(AuthService.login('test@test.com', 'password')).rejects.toThrow('Identifiants invalides');
    });

    it('should throw error if password is invalid', async () => {
      const mockUser = {
        _id: '123',
        email: 'test@test.com',
        password: 'hashedpassword'
      };

      axios.get.mockResolvedValue({
        data: { success: true, data: mockUser }
      });
      bcrypt.compare.mockResolvedValue(false);

      await expect(AuthService.login('test@test.com', 'wrongpassword')).rejects.toThrow('Identifiants invalides');
    });

    it('should throw error if user has no password', async () => {
      const mockUser = {
        _id: '123',
        email: 'test@test.com'
      };

      axios.get.mockResolvedValue({
        data: { success: true, data: mockUser }
      });

      await expect(AuthService.login('test@test.com', 'password')).rejects.toThrow('Identifiants invalides');
    });
  });

  describe('register', () => {
    it('should register successfully with valid data', async () => {
      const mockUser = {
        _id: '123',
        email: 'test@test.com',
        firstname: 'John',
        lastname: 'Doe',
        typeAbonnement: 'free'
      };

      bcrypt.hash.mockResolvedValue('hashedpassword');
      axios.post.mockResolvedValueOnce({
        data: { success: true, data: mockUser }
      });
      axios.post.mockResolvedValueOnce({});
      jwt.sign.mockReturnValue('token123');

      const result = await AuthService.register('test@test.com', 'password', 'John', 'Doe');

      expect(bcrypt.hash).toHaveBeenCalledWith('password', 12);
      expect(axios.post).toHaveBeenCalledWith(`${process.env.BDD_SERVICE_URL}/api/user`, {
        email: 'test@test.com',
        password: 'hashedpassword',
        firstname: 'John',
        lastname: 'Doe',
        typeAbonnement: 'free'
      });
      expect(axios.post).toHaveBeenCalledWith(`${process.env.NOTIFICATION_SERVICE_URL}/api/email/welcome`, {
        email: 'test@test.com',
        firstname: 'John',
        lastname: 'Doe'
      });
      expect(result.token).toBe('token123');
    });

    it('should throw error if required fields missing', async () => {
      await expect(AuthService.register('', 'password', 'John', 'Doe'))
        .rejects.toThrow('Tous les champs sont requis');
      await expect(AuthService.register('test@test.com', '', 'John', 'Doe'))
        .rejects.toThrow('Tous les champs sont requis');
      await expect(AuthService.register('test@test.com', 'password', '', 'Doe'))
        .rejects.toThrow('Tous les champs sont requis');
      await expect(AuthService.register('test@test.com', 'password', 'John', ''))
        .rejects.toThrow('Tous les champs sont requis');
    });

    it('should continue registration even if welcome email fails', async () => {
      const mockUser = {
        _id: '123',
        email: 'test@test.com',
        firstname: 'John',
        lastname: 'Doe',
        typeAbonnement: 'free'
      };

      bcrypt.hash.mockResolvedValue('hashedpassword');
      axios.post.mockResolvedValueOnce({
        data: { success: true, data: mockUser }
      });
      axios.post.mockRejectedValueOnce(new Error('Email service down'));
      jwt.sign.mockReturnValue('token123');

      const result = await AuthService.register('test@test.com', 'password', 'John', 'Doe');

      expect(result.token).toBe('token123');
      expect(console.error).toHaveBeenCalledWith('Erreur envoi email de bienvenue:', expect.any(Error));
    });

    it('should throw error if user creation fails', async () => {
      bcrypt.hash.mockResolvedValue('hashedpassword');
      axios.post.mockResolvedValue({
        data: { success: false, message: 'Email already exists' }
      });

      await expect(AuthService.register('test@test.com', 'password', 'John', 'Doe'))
        .rejects.toThrow('Email already exists');
    });
  });

  describe('getCurrentUser', () => {
    it('should return user data with valid token', async () => {
      const mockUser = {
        _id: '123',
        email: 'test@test.com',
        password: 'hashedpassword'
      };

      jwt.verify.mockReturnValue({ id: '123' });
      axios.get.mockResolvedValue({
        data: { success: true, data: mockUser }
      });

      const result = await AuthService.getCurrentUser('valid.jwt.token');

      expect(jwt.verify).toHaveBeenCalledWith('valid.jwt.token', 'secret');
      expect(axios.get).toHaveBeenCalledWith(`${process.env.BDD_SERVICE_URL}/api/user/123`);
      expect(result).toEqual({
        _id: '123',
        email: 'test@test.com'
      });
    });

    it('should throw error if token missing', async () => {
      await expect(AuthService.getCurrentUser()).rejects.toThrow('Token invalide');
      await expect(AuthService.getCurrentUser('')).rejects.toThrow('Token invalide');
      await expect(AuthService.getCurrentUser('   ')).rejects.toThrow('Token invalide');
    });

    it('should throw error if token malformed', async () => {
      await expect(AuthService.getCurrentUser('invalid.token'))
        .rejects.toThrow('Token malformé');
      await expect(AuthService.getCurrentUser('invalid'))
        .rejects.toThrow('Token malformé');
    });

    it('should throw error if token invalid', async () => {
      jwt.verify.mockImplementation(() => {
        const error = new Error('invalid signature');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      await expect(AuthService.getCurrentUser('valid.format.token'))
        .rejects.toThrow('Token invalide ou malformé');
    });

    it('should throw error if token expired', async () => {
      jwt.verify.mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await expect(AuthService.getCurrentUser('expired.format.token'))
        .rejects.toThrow('Token expiré');
    });

    it('should throw error if decoded token missing id', async () => {
      jwt.verify.mockReturnValue({ email: 'test@test.com' });

      await expect(AuthService.getCurrentUser('valid.format.token'))
        .rejects.toThrow('Token invalide - ID manquant');
    });

    it('should throw error if user not found in database', async () => {
      jwt.verify.mockReturnValue({ id: '123' });
      axios.get.mockResolvedValue({
        data: { success: false }
      });

      await expect(AuthService.getCurrentUser('valid.format.token'))
        .rejects.toThrow('Utilisateur non trouvé');
    });
  });
});