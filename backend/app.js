const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const convertRoutes = require('./routes/convertRoutes');
const { paths } = require('./config/appConfig');

const app = express();

fs.ensureDirSync(paths.uploads);
fs.ensureDirSync(paths.converted);
fs.ensureDirSync(paths.temp);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(paths.frontend));
app.use('/api', convertRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(paths.frontend, 'index.html'));
});

app.use((error, req, res, next) => {
  res.status(500).json({ error: error.message || 'Erro interno.' });
});

module.exports = app;
