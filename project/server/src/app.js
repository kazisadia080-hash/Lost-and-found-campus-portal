import express from 'express';
import cors from 'cors';
import './config/db.js';
import authRoutes from './routes/auth.js';
import itemRoutes from './routes/items.js';
import claimRoutes from './routes/claims.js';
import adminRoutes from './routes/admin.js';
import messageRoutes from './routes/messages.js';
import userRoutes from './routes/users.js';

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://lost-and-found-campus-portal-phi.vercel.app',
  'http://localhost:5173',
]
  .filter(Boolean)
  .map((url) => url.replace(/\/$/, ''));

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (curl, server-to-server, health checks)
      if (!origin) return callback(null, true);

      const normalized = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(normalized)) {
        return callback(null, true);
      }

      console.warn(`Blocked by CORS: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '12mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

app.use((req, res) => res.status(404).json({ message: 'Not found' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

export default app;