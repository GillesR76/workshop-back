const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const roomRoutes = require('./routes/room');
const userRoutes = require('./routes/user');
const imageRoutes = require('./routes/image');

// Créer le dossier 'images' s'il n'existe pas
const dir = path.join(__dirname, 'images');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

mongoose.connect("mongodb+srv://benjaminmazars:HwzHJvpszgP6g8Oa@todolist.sqrrtvv.mongodb.net/?retryWrites=true&w=majority&appName=ToDoList")
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

const app = express();

// Augmentez la limite de taille du body
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(express.json());

app.use(cors({
  origin: 'http://localhost:5173', // L'URL de votre frontend
  credentials: true
}));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.use('/api/auth', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/images', imageRoutes);

app.use('/images', express.static(path.join(__dirname, 'images')));

app.get('/test', (req, res) => res.send('Test route'));

app.use((req, res, next) => {
  console.log(`Requête reçue: ${req.method} ${req.url}`);
  next();
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Une erreur est survenue sur le serveur' });
});

module.exports = app;