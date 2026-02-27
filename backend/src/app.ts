import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { corsOptions } from './config/cors.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import companiesRoutes from './modules/companies/companies.routes.js';
import customersRoutes from './modules/customers/customers.routes.js';
import arRoutes from './modules/ar/ar.routes.js';
import vendorsRoutes from './modules/vendors/vendors.routes.js';
import apRoutes from './modules/ap/ap.routes.js';
import { successResponse } from './shared/utils/response.js';

export const app = express();

// Security & parsing
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json(successResponse({ status: 'ok', timestamp: new Date().toISOString() }));
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/companies', companiesRoutes);
app.use('/api/v1/customers', customersRoutes);
app.use('/api/v1/ar', arRoutes);
app.use('/api/v1/vendors', vendorsRoutes);
app.use('/api/v1/ap', apRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// Error handler
app.use(errorHandler);
