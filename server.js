require('dotenv').config();
const app = require('./src/app');
const { initDB } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`\n🔥 ForgeFit server running at http://localhost:${PORT}\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    console.error('\nMake sure PostgreSQL is running and your .env credentials are correct.');
    process.exit(1);
  }
}

start();
