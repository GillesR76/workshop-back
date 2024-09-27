const Image = require('../models/Image');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

exports.createImage = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier n\'a été uploadé.' });
  }

  try {
    const { buffer, originalname } = req.file;
    const timestamp = Date.now();
    const ref = `${timestamp}-${path.parse(originalname).name}.webp`;
    const imagePath = path.join('images', ref);

    // Redimensionner et optimiser l'image
    await sharp(buffer)
      .resize({
        width: 1200,
        height: 800,
        fit: 'inside', // Garde le ratio d'aspect
        withoutEnlargement: true // Ne pas agrandir si l'image est plus petite
      })
      .webp({ quality: 80 }) // Réduire légèrement la qualité pour optimiser la taille
      .toFile(imagePath);

    const imageUrl = `${req.protocol}://${req.get('host')}/images/${ref}`;

    const image = new Image({
      title: req.body.title,
      description: req.body.description,
      filename: ref
    });

    const savedImage = await image.save();
    res.status(201).json({ 
      message: 'Image enregistrée !', 
      image: {
        _id: savedImage._id,
        title: savedImage.title,
        description: savedImage.description,
        createdAt: savedImage.createdAt,
        imageUrl: imageUrl
      }
    });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'image:', error);
    res.status(500).json({ error: error.toString() });
  }
};

exports.getAllImages = async (req, res, next) => {
  try {
    const images = await Image.find().sort({ createdAt: -1 });
    const imageData = images.map(img => ({
      _id: img._id,
      title: img.title,
      description: img.description,
      createdAt: img.createdAt,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${img.filename}`
    }));
    res.status(200).json(imageData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getOneImage = async (req, res, next) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Image non trouvée' });
    }
    const imagePath = path.join(__dirname, '..', 'images', image.filename);
    res.sendFile(imagePath);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.modifyImage = async (req, res, next) => {
  try {
    const imageData = req.file ? 
      { 
        ...req.body, 
        filename: `${Date.now()}-${path.parse(req.file.originalname).name}.webp`,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${Date.now()}-${path.parse(req.file.originalname).name}.webp` 
      } : 
      { ...req.body };
    
    if (req.file) {
      const imagePath = path.join('images', imageData.filename);
      await sharp(req.file.buffer)
        .resize({
          width: 1200,
          height: 800,
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 80 })
        .toFile(imagePath);
    }

    const updatedImage = await Image.findByIdAndUpdate(req.params.id, imageData, { new: true });
    if (!updatedImage) {
      return res.status(404).json({ message: 'Image non trouvée' });
    }
    res.status(200).json(updatedImage);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteImage = async (req, res, next) => {
  try {
    // Vérifier si l'utilisateur est un administrateur
    if (!req.auth.isAdmin) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Image non trouvée' });
    }

    const imagePath = path.join(__dirname, '..', 'images', image.filename);
    fs.unlink(imagePath, async (err) => {
      if (err) {
        console.error("Erreur lors de la suppression du fichier:", err);
      }
      await Image.deleteOne({ _id: req.params.id });
      res.status(200).json({ message: 'Image supprimée avec succès', deletedId: req.params.id });
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};