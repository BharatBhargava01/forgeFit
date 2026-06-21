const express = require('express');
const cors = require('cors');
const path = require('path');

const workoutsRoutes = require('./routes/workouts.routes');
const routinesRoutes = require('./routes/routines.routes');
const exercisesRoutes = require('./routes/exercises.routes');
const logsRoutes = require('./routes/logs.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/workouts', workoutsRoutes);
app.use('/api/routines', routinesRoutes);
app.use('/api/exercises', exercisesRoutes);
app.use('/api/logs', logsRoutes);

// SPA Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

module.exports = app;
