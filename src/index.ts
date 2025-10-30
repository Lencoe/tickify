import express from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes/usersRoutes';
import eventRoutes from './routes/eventsRoutes';

dotenv.config();

const app = express();
app.use(express.json());

app.get('/ping', (_req, res) => {
  res.send('API working ✅');
});

app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
