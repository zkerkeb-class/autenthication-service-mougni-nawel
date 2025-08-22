const request = require('supertest');
const express = require('express');
const authRoutes = require('../../src/routes/auth.route');

jest.mock('../../src/controllers/auth.controller', () => ({
  login: jest.fn((req, res) => res.json({ success: true, message: 'Login success' })),
  register: jest.fn((req, res) => res.json({ success: true, message: 'Register success' })),
  logout: jest.fn((req, res) => res.json({ success: true, message: 'Logout success' })),
  me: jest.fn((req, res) => res.json({ success: true, data: { id: '123', email: 'test@test.com' } }))
}));

jest.mock('../../src/middlewares/authMiddleware', () => (req, res, next) => {
  req.user = { id: '123', email: 'test@test.com' };
  next();
});

// Setup
const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should call login controller', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'password' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /auth/register', () => {
    it('should call register controller', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          user: {
            email: 'test@test.com',
            password: 'password',
            firstname: 'John',
            lastname: 'Doe'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /auth/logout', () => {
    it('should call logout controller with auth middleware', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', 'Bearer validtoken');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /auth/me', () => {
    it('should call me controller', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer validtoken');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});