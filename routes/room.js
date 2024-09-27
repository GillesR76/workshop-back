const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const auth = require("../middleware/auth");
const roomCtrl = require("../controllers/room");
const { format, parse } = require('date-fns');

// Middleware pour vérifier si l'utilisateur est un admin
const isAdmin = (req, res, next) => {
    if (req.auth && req.auth.grade === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Accès refusé. Vous devez être administrateur.' });
    }
};

// Créer une nouvelle salle (admin seulement)
router.post("/", auth, isAdmin, roomCtrl.createRoom);

// Obtenir toutes les salles (accessible à tous les utilisateurs authentifiés)
router.get("/", auth, roomCtrl.findRooms);

// Obtenir une salle spécifique (accessible à tous les utilisateurs authentifiés)
router.get("/:id", auth, roomCtrl.findOneRoom);

// Mettre à jour une salle (admin seulement)
router.put("/:id", auth, isAdmin, roomCtrl.updateRoom);

// Supprimer une salle (admin seulement)
router.delete("/:id", auth, isAdmin, roomCtrl.deleteRoom);

// Ajouter une réservation (admin et utilisateur)
router.post("/reservations", auth, roomCtrl.addReservation);

// Annuler une réservation (admin et utilisateur)
router.delete("/:roomId/reservations", auth, roomCtrl.cancelReservation);

module.exports = router;