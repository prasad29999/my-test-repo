import dotenv from 'dotenv';
dotenv.config(); // MUST be first

console.log('🔥 server.js loaded');
console.log('🔥 NODE_ENV:', process.env.NODE_ENV);
console.log('🔥 PORT:', process.env.PORT);

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import fs from 'fs-extra';
import multer from 'multer';

/**
 * Express Server
 * Main entry point for the API
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

/* =====================
   UPLOADS
===================== */

const verificationUploadsDir = path.join(
  process.cwd(),
  'backend',
  'uploads',
  'verification'
);

fs.ensureDirSync(verificationUploadsDir);
app.use('/uploads/verification', express.static(verificationUploadsDir));

/* =====================
   CORS
===================== */

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      try {
        const host = new URL(origin).host;
        if (host.endsWith('.up.railway.app')) {
          return callback(null, true);
        }
      } catch {}

      if (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }

      const allowedOrigins = (process.env.CORS_ORIGIN || '')
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);

      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =====================
   LOGGING
===================== */

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/* =====================
   HEALTH
===================== */

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/* =====================
   ROUTES
===================== */

const loadRoutes = async () => {
  const safeImport = async (p) => {
    try {
      const mod = await import(p);
      return mod.default || mod;
    } catch (err) {
      console.warn(`⚠️ Could not load ${p}:`, err.message);
      return null;
    }
  };

  const routes = {
    auth: await safeImport('./core/auth/routes.js'),
    users: await safeImport('./core/users/routes.js'),
    projects: await safeImport('./features/projects/routes/projects.routes.js'),
  };

  if (routes.auth) app.use('/api/auth', routes.auth);
  if (routes.users) app.use('/api/users', routes.users);
  if (routes.projects) app.use('/api/projects', routes.projects);
};

/* =====================
   START SERVER
===================== */

(async () => {
  await loadRoutes();

  const frontendDist = path.resolve(__dirname, 'public');

  console.log('🔍 Frontend dist:', frontendDist);
  console.log('🔍 Exists:', fs.existsSync(frontendDist));

  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})();
