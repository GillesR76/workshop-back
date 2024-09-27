const Room = require("../models/Room");

function getLocalDate(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
}

exports.findRooms = (req, res, next) => {
  Room.find()
    .then((rooms) => {
      const adjustedRooms = rooms.map((room) => ({
        ...room._doc,
        startDate: getLocalDate(new Date(room.startDate)),
        endDate: getLocalDate(new Date(room.endDate)),
      }));
      res.status(200).json(adjustedRooms);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

exports.findOneRoom = (req, res, next) => {
  Room.findById(req.params.id)
    .then((room) => {
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }
      const adjustedRoom = {
        ...room._doc,
        startDate: getLocalDate(new Date(room.startDate)),
        endDate: getLocalDate(new Date(room.endDate)),
      };
      res.status(200).json(adjustedRoom);
    })
    .catch((error) => {
      res.status(500).json({
        error: error.message,
      });
    });
};

exports.createRoom = (req, res, next) => {
  const { name, equipment } = req.body;
  
  const room = new Room({
    name,
    equipment,
    reservations: []
  });

  room.save()
    .then(() => res.status(201).json({ message: 'Salle créée !', room }))
    .catch(error => res.status(400).json({ error }));
};

exports.updateRoom = (req, res, next) => {
  const room = {
    name: req.body.name,
    equipment: req.body.equipment,
    startDate: getLocalDate(new Date(req.body.startDate)),
    endDate: getLocalDate(new Date(req.body.endDate)),
  };

  Room.findByIdAndUpdate(req.params.id, room, { new: true })
    .then((updatedRoom) => {
      if (!updatedRoom) {
        return res.status(404).json({ message: "Room not found" });
      }
      const adjustedRoom = {
        ...updatedRoom._doc,
        startDate: getLocalDate(new Date(updatedRoom.startDate)),
        endDate: getLocalDate(new Date(updatedRoom.endDate)),
      };
      res.status(200).json({
        message: "Room updated successfully!",
        room: adjustedRoom,
      });
    })
    .catch((error) => {
      res.status(400).json({
        error: error.message,
      });
    });
};

exports.deleteRoom = (req, res, next) => {
  Room.deleteOne({ _id: req.params.id })
    .then(() => {
      res.status(200).json({
        message: "Room deleted!",
      });
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

exports.addReservation = (req, res, next) => {
  const { roomId, date } = req.body;
  
  // Les administrateurs peuvent réserver sans restrictions
  if (req.user.grade !== 'admin' && req.user.grade !== 'utilisateur') {
    return res.status(403).json({ message: "Vous n'avez pas les droits pour faire une réservation" });
  }

  Room.findById(roomId)
    .then(room => {
      if (!room) {
        return res.status(404).json({ message: "Salle non trouvée" });
      }
      
      if (room.reservations.includes(date) && req.user.grade !== 'admin') {
        return res.status(400).json({ message: "Cette salle est déjà réservée pour cette date" });
      }
      
      // Si c'est un admin, on peut écraser une réservation existante
      const index = room.reservations.indexOf(date);
      if (index !== -1) {
        room.reservations.splice(index, 1);
      }
      
      room.reservations.push(date);
      return room.save();
    })
    .then(updatedRoom => {
      res.status(200).json({ message: "Réservation ajoutée avec succès", room: updatedRoom });
    })
    .catch(error => {
      console.error('Erreur lors de l\'ajout de la réservation:', error);
      res.status(500).json({ 
        message: "Erreur serveur lors de l'ajout de la réservation", 
        error: error.toString()
      });
    });
};

exports.getReservations = (req, res, next) => {
  const { start, end } = req.query;
  console.log('Start date:', start);
  console.log('End date:', end);

  Room.find()
    .then(rooms => {
      const reservations = rooms.flatMap(room => 
        room.reservations
          .filter(date => date >= start && date <= end)
          .map(date => ({
            roomId: room._id.toString(),
            date: date
          }))
      );
      console.log('Found reservations:', reservations);
      res.status(200).json(reservations);
    })
    .catch(error => {
      console.error('Error in getReservations:', error);
      res.status(500).json({ error: error.message });
    });
};

exports.cancelReservation = (req, res, next) => {
  const { roomId } = req.params;
  const { date } = req.body;
  
  Room.findById(roomId)
    .then(room => {
      if (!room) {
        return res.status(404).json({ message: "Salle non trouvée" });
      }
      
      const index = room.reservations.indexOf(date);
      if (index === -1) {
        return res.status(400).json({ message: "Réservation non trouvée" });
      }
      
      room.reservations.splice(index, 1);
      return room.save();
    })
    .then(updatedRoom => {
      res.status(200).json({ message: "Réservation annulée avec succès", room: updatedRoom });
    })
    .catch(error => {
      console.error('Error in cancelReservation:', error);
      res.status(500).json({ 
        message: "Erreur serveur lors de l'annulation de la réservation", 
        error: error.toString()
      });
    });
};