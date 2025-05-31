// art-gallery-backend-novo/routes/artistRoutes.js
const express = require('express');
const router = express.Router();
const artistController = require('../controllers/artistController');
const { protect, isAdmin } = require('../middleware/authMiddleware'); // Nossos middlewares de proteção

// Rotas Públicas (não precisam de token)
router.get('/', artistController.getAllArtists);          // Listar todos os artistas
router.get('/:id', artistController.getArtistById);     // Obter um artista específico

// Rotas Protegidas (requerem login e token JWT, e são apenas para Admins)
router.post('/', protect, isAdmin, artistController.createArtist);       // Criar novo artista
router.put('/:id', protect, isAdmin, artistController.updateArtist);       // Atualizar artista
router.delete('/:id', protect, isAdmin, artistController.deleteArtist);   // Deletar artista

module.exports = router;