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
 * LAD Architecture - Feature-Based Modular Structure
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Railway-safe PORT
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
   CORS & BODY
===================== */

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }

      const allowedOrigins = (process.env.CORS_ORIGIN || '')
        .split(',')
        .filter(Boolean);

      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
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
  res.json({
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

/* =====================
   ROUTE VARIABLES
===================== */

let authRoutes = null;
let usersRoutes = null;
let profilesRoutes = null;
let exitFormalitiesRoutes = null;
let payrollPfRoutes = null;
let timesheetRoutes = null;
let projectsRoutes = null;
let issuesRoutes = null;
let payslipsRoutes = null;
let monitoringRoutes = null;
let timeClockRoutes = null;
let leaveCalendarRoutes = null;
let gitRoutes = null;
let hrDocumentsRoutes = null;
let joiningFormRoutes = null;
let recruitmentRoutes = null;

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

  authRoutes = await safeImport('./core/auth/routes.js');
  usersRoutes = await safeImport('./core/users/routes.js');
  profilesRoutes = await safeImport('./src/routes/profiles.js');
  exitFormalitiesRoutes = await safeImport('./features/exit-formalities/routes/exit-formalities.routes.js');
  payrollPfRoutes = await safeImport('./features/payroll-pf/routes/payroll-pf.routes.js');
  timesheetRoutes = await safeImport('./features/timesheet/routes/timesheet.routes.js');
  projectsRoutes = await safeImport('./features/projects/routes/projects.routes.js');
  issuesRoutes = await safeImport('./features/issues/routes/issues.routes.js');
  payslipsRoutes = await safeImport('./features/payslips/routes/payslips.routes.js');
  monitoringRoutes = await safeImport('./features/monitoring/routes/monitoring.routes.js');
  timeClockRoutes = await safeImport('./features/time-clock/routes/time-clock.routes.js');
  leaveCalendarRoutes = await safeImport('./features/leave-calendar/routes/leave-calendar.routes.js');
  gitRoutes = await safeImport('./features/git/routes/git.routes.js');
  hrDocumentsRoutes = await safeImport('./features/hr-documents/routes/hr-documents.routes.js');
  joiningFormRoutes = await safeImport('./features/joining-form/routes/joining-form.routes.js');
  recruitmentRoutes = await safeImport('./features/recruitment/routes/index.js');

  if (authRoutes) app.use('/api/auth', authRoutes);
  if (usersRoutes) app.use('/api/users', usersRoutes);
  if (profilesRoutes) app.use('/api/profiles', profilesRoutes);
  if (exitFormalitiesRoutes) app.use('/api/exit-formalities', exitFormalitiesRoutes);
  if (payrollPfRoutes) app.use('/api/payroll-pf', payrollPfRoutes);
  if (timesheetRoutes) {
    app.use('/api/timesheets', timesheetRoutes);
    app.use('/api/timesheet', timesheetRoutes);
  }
  if (projectsRoutes) app.use('/api/projects', projectsRoutes);
  if (issuesRoutes) app.use('/api/issues', issuesRoutes);
  if (payslipsRoutes) app.use('/api/payslips', payslipsRoutes);
  if (monitoringRoutes) app.use('/api/monitoring', monitoringRoutes);
  if (timeClockRoutes) app.use('/api/time-clock', timeClockRoutes);
  if (leaveCalendarRoutes) app.use('/api/leave-calendar', leaveCalendarRoutes);
  if (gitRoutes) app.use('/api/git', gitRoutes);
  if (joiningFormRoutes) app.use('/api/joining-form', joiningFormRoutes);
  if (recruitmentRoutes) app.use('/api/recruitment', recruitmentRoutes);
  if (hrDocumentsRoutes) app.use('/api/hr-documents', hrDocumentsRoutes);
};

/* =====================
   STARTUP
===================== */

(async () => {
  await loadRoutes();

  /* =====================
     ERROR HANDLER
  ===================== */

  app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
    });
  });

  /* =====================
     FRONTEND (STATIC)
     MUST BE BEFORE 404
  ===================== */

  const frontendPath = path.resolve(__dirname, './public');

  console.log('🔍 Frontend path:', frontendPath);
  console.log('🔍 Exists:', fs.existsSync(frontendPath));

  if (fs.existsSync(frontendPath)) {
    console.log('🌐 Serving frontend from backend/public');

    app.use(express.static(frontendPath));

    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
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

  /* =====================
     START SERVER
  ===================== */

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
🚀 Server running on port ${PORT}
🌐 Environment: ${process.env.NODE_ENV || 'production'}
📊 API: /api/*
❤️  Health: /health
    `);
  });
})();

export default app;
