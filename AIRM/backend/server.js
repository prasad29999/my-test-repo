import dotenv from 'dotenv';
dotenv.config();

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
   CORS (FINAL FIX)
===================== */

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow direct browser hits (/, assets, favicon)
      if (!origin) return callback(null, true);

      // Allow Railway same-origin
      try {
        const host = new URL(origin).host;
        if (host.endsWith('.up.railway.app')) {
          return callback(null, true);
        }
      } catch {}

      // Allow localhost for dev
      if (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }

      // Optional extra origins via env
      const allowedOrigins = (process.env.CORS_ORIGIN || '')
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);

      if (allowedOrigins.includes(origin)) {
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
   REQUEST LOGGING
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
   ROUTE LOADER
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
    profiles: await safeImport('./src/routes/profiles.js'),
    exitFormalities: await safeImport('./features/exit-formalities/routes/exit-formalities.routes.js'),
    payrollPf: await safeImport('./features/payroll-pf/routes/payroll-pf.routes.js'),
    timesheet: await safeImport('./features/timesheet/routes/timesheet.routes.js'),
    projects: await safeImport('./features/projects/routes/projects.routes.js'),
    issues: await safeImport('./features/issues/routes/issues.routes.js'),
    payslips: await safeImport('./features/payslips/routes/payslips.routes.js'),
    monitoring: await safeImport('./features/monitoring/routes/monitoring.routes.js'),
    timeClock: await safeImport('./features/time-clock/routes/time-clock.routes.js'),
    leaveCalendar: await safeImport('./features/leave-calendar/routes/leave-calendar.routes.js'),
    git: await safeImport('./features/git/routes/git.routes.js'),
    hrDocuments: await safeImport('./features/hr-documents/routes/hr-documents.routes.js'),
    joiningForm: await safeImport('./features/joining-form/routes/joining-form.routes.js'),
    recruitment: await safeImport('./features/recruitment/routes/index.js'),
  };

  if (routes.auth) app.use('/api/auth', routes.auth);
  if (routes.users) app.use('/api/users', routes.users);
  if (routes.profiles) app.use('/api/profiles', routes.profiles);
  if (routes.exitFormalities) app.use('/api/exit-formalities', routes.exitFormalities);
  if (routes.payrollPf) app.use('/api/payroll-pf', routes.payrollPf);
  if (routes.timesheet) {
    app.use('/api/timesheet', routes.timesheet);
    app.use('/api/timesheets', routes.timesheet);
  }
  if (routes.projects) app.use('/api/projects', routes.projects);
  if (routes.issues) app.use('/api/issues', routes.issues);
  if (routes.payslips) app.use('/api/payslips', routes.payslips);
  if (routes.monitoring) app.use('/api/monitoring', routes.monitoring);
  if (routes.timeClock) app.use('/api/time-clock', routes.timeClock);
  if (routes.leaveCalendar) app.use('/api/leave-calendar', routes.leaveCalendar);
  if (routes.git) app.use('/api/git', routes.git);
  if (routes.joiningForm) app.use('/api/joining-form', routes.joiningForm);
  if (routes.recruitment) app.use('/api/recruitment', routes.recruitment);
  if (routes.hrDocuments) app.use('/api/hr-documents', routes.hrDocuments);
};

/* =====================
   START SERVER
===================== */

(async () => {
  await loadRoutes();

  /* =====================
     FRONTEND (FINAL FIX)
  ===================== */

  const frontendDist = path.resolve(process.cwd(), 'frontend', 'dist');

  console.log('🔍 Frontend dist:', frontendDist);
  console.log('🔍 Exists:', fs.existsSync(frontendDist));

  if (fs.existsSync(frontendDist)) {
    console.log('🌐 Serving frontend from frontend/dist');

    app.use(express.static(frontendDist));

    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  } else {
    console.log('ℹ️ Frontend dist not found — API-only mode');
  }

  /* =====================
     API 404 ONLY
  ===================== */

  app.use('/api', (req, res) => {
    res.status(404).json({
      error: 'Not found',
      message: `API route ${req.method} ${req.path} not found`,
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})();

export default app;
