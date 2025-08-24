const path = require('path');

require('dotenv').config({ 
  path: path.resolve(__dirname, '../.env.dev') 
});

global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'test';
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'secret';
if (!process.env.BDD_SERVICE_URL) process.env.BDD_SERVICE_URL = 'http://bdd:8000';
if (!process.env.NOTIFICATION_SERVICE_URL) process.env.NOTIFICATION_SERVICE_URL = 'http://notification:8016';

jest.setTimeout(10000);

describe('Setup', () => {
  it('should configure test environment', () => {
    expect(process.env.NODE_ENV).toBeDefined();
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.BDD_SERVICE_URL).toBeDefined();
  });
});