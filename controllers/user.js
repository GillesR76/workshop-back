const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require('jsonwebtoken');
const validator = require('validator');


exports.signup = (req, res, next) => {
    if (!req.body.email || !validator.isEmail(req.body.email)) {
        return res.status(400).json({ error: "L'e-mail fourni n'est pas valide." });
    }

    bcrypt.hash(req.body.password, 10)
        .then(hash => {
            const user = new User({
                email: req.body.email,
                password: hash,
                grade: 'visiteur' // Par défaut, le nouvel utilisateur est un visiteur
            });
            user.save()
                .then(() => res.status(201).json({ message: "Utilisateur créé" }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};

exports.login = (req, res, next) => {
    User.findOne({ email: req.body.email })
        .then(user => {
            if (!user) {
                return res.status(401).json({ error: 'Utilisateur non trouvé !' });
            }
            bcrypt.compare(req.body.password, user.password)
                .then(valid => {
                    if (!valid) {
                        return res.status(401).json({ error: 'Mot de passe incorrect !' });
                    }
                    res.status(200).json({
                        userId: user._id,
                        grade: user.grade,
                        token: jwt.sign(
                            { userId: user._id, grade: user.grade },
                            'RANDOM_TOKEN_SECRET',
                            { expiresIn: '24h' }
                        )
                    });
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};

// Nouvelle fonction pour mettre à jour le grade d'un utilisateur
exports.updateGrade = (req, res, next) => {
    // La vérification du grade admin est maintenant gérée par le middleware isAdmin
    if (!['admin', 'utilisateur', 'visiteur'].includes(req.body.grade)) {
        return res.status(400).json({ error: "Grade invalide" });
    }

    User.findByIdAndUpdate(req.params.id, { grade: req.body.grade }, { new: true })
        .then(user => {
            if (!user) {
                return res.status(404).json({ error: "Utilisateur non trouvé" });
            }
            res.status(200).json({ message: "Grade mis à jour avec succès", user: { id: user._id, email: user.email, grade: user.grade } });
        })
        .catch(error => res.status(400).json({ error }));
};

// Nouvelle fonction pour envoyer une demande de grade
exports.requestGrade = (req, res, next) => {
    User.findByIdAndUpdate(req.user.userId, { gradeRequest: true }, { new: true })
        .then(user => {
            if (!user) {
                return res.status(404).json({ error: 'Utilisateur non trouvé' });
            }
            res.status(200).json({ message: 'Demande de grade envoyée' });
        })
        .catch(error => res.status(400).json({ error }));
};

// Nouvelle fonction pour récupérer les demandes de grade
exports.getGradeRequests = async (req, res, next) => {
    try {
        const users = await User.find({ gradeRequest: true });
        const filteredUsers = users.filter(user => user && user.grade && user.grade !== 'admin' && user.grade !== 'utilisateur');
        res.status(200).json(filteredUsers);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Nouvelle fonction pour approuver une demande de grade
exports.approveGrade = (req, res, next) => {
    if (req.user.grade !== 'admin') {
        return res.status(403).json({ error: 'Non autorisé' });
    }
    const { approve } = req.body;
    const updateData = approve 
        ? { grade: 'utilisateur', gradeRequest: false }
        : { gradeRequest: false };
    
    User.findByIdAndUpdate(req.params.userId, updateData, { new: true })
        .then(user => {
            if (!user) {
                return res.status(404).json({ error: 'Utilisateur non trouvé' });
            }
            const message = approve ? 'Grade mis à jour' : 'Demande de grade refusée';
            res.status(200).json({ message, user: { id: user._id, email: user.email, grade: user.grade } });
        })
        .catch(error => res.status(400).json({ error }));
};