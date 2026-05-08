/**
 * @fileoverview Express server entry point for the Task Management System.
 * Configures middleware, routes, error handling, and starts the HTTP server.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ── Middleware ──────────────────────────────────────────────────────────────

/**
 * Request logging middleware for development.
 */
function requestLogger(req, res, next) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  console.log(`[${timestamp}] ${method} ${url}`);
  next();
}

app.use(requestLogger);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── CORS Headers ────────────────────────────────────────────────────────────

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ── API Routes ──────────────────────────────────────────────────────────────

const tasksRouter = require('./routes/tasks');
const statsRouter = require('./routes/stats');

app.use('/api/tasks', tasksRouter);
app.use('/api/stats', statsRouter);

// ── Health Check ────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  });
});

// ── Static Files (Production) ──────────────────────────────────────────────

const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// ── 404 Handler ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// ── Global Error Handler ────────────────────────────────────────────────────

app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
});

// ── Server Start ────────────────────────────────────────────────────────────

function startServer() {
  app.listen(PORT, () => {
    console.log('=================================');
    console.log('  Task Management System Server');
    console.log('=================================');
    console.log(`  Environment: ${NODE_ENV}`);
    console.log(`  Port:        ${PORT}`);
    console.log(`  API Base:    http://localhost:${PORT}/api`);
    console.log('=================================');
  });
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
