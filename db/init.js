const { initDB } = require('../src/config/database');

async function run() {
  try {
    console.log('🔄 Initializing database tables...');
    await initDB();
    console.log('✅ Database initialization completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    process.exit(1);
  }
}

run();
