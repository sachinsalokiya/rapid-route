const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const { notFound, errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

app.set('trust proxy', 1);

const clientOrigin =
  process.env.CLIENT_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5173';

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 300 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

app.get('/health', (_req, res) => {
  res.json({ success: true, service: 'rapid-route-api', status: 'ok' });
});

app.use('/api', routes);

// Production: serve the Vite build from the same service (one public URL)
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
const serveFrontend =
  process.env.NODE_ENV === 'production' &&
  process.env.SERVE_FRONTEND !== 'false' &&
  fs.existsSync(path.join(frontendDist, 'index.html'));

if (serveFrontend) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path === '/health') {
      return next();
    }
    return res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
