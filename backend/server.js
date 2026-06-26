const app = require('./app');
const { port } = require('./config/appConfig');
const { startCleanupJob } = require('./services/cleanupService');

app.listen(port, () => {
  console.log(`ConvertX rodando na porta ${port}`);
  startCleanupJob();
});
