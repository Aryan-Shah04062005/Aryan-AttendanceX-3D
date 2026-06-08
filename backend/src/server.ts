import app, { initializeApp } from './app.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await initializeApp();
    app.listen(PORT, () => {
      console.log('\x1b[35m%s\x1b[0m', `🚀 Aryan AttendanceX 3D API is listening on http://localhost:${PORT}`);
      console.log('\x1b[36m%s\x1b[0m', `📝 API Health Status: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to initialize server application:', error);
    process.exit(1);
  }
}

startServer();
