import { Application } from './app/Application.js';

const app = new Application();

const shutdown = async (signal) => {
  try {
    await app.stop();
    process.exit(0);
  } catch (error) {
    console.error(`Error cerrando app tras ${signal}:`, error);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

app.start().catch((error) => {
  console.error('Fallo al iniciar IO-Bot V2:', error);
  process.exit(1);
});
