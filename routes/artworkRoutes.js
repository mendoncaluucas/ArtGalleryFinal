// art-gallery-backend-novo/routes/artworkRoutes.js
const express = require('express');
const router = express.Router();
const artworkController = require('../controllers/artworkController');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const { uploadArtworkImage } = require('../middleware/uploadMiddleware'); // <<< ADICIONE ESTA LINHA

// Rotas Públicas
router.get('/', artworkController.getAllArtworks);
router.get('/:id', artworkController.getArtworkById);

// Rota para criar obra (qualquer usuário logado)
// Agora usa o middleware de upload para o campo 'artworkImage'
router.post(
    '/', 
    protect, 
    uploadArtworkImage.single('artworkImage'), // <<< ADICIONE ESTA LINHA (antes do controller)
    artworkController.createArtwork
);

// Rota para atualizar obra (Admin) - Opcional: Adicionar upload de imagem na atualização também
router.put('/:id', protect, isAdmin, artworkController.updateArtwork);
// Se quiser permitir atualização de imagem:
// router.put('/:id', protect, isAdmin, uploadArtworkImage.single('artworkImage'), artworkController.updateArtwork);


// Rota para deletar obra (Admin)
router.delete('/:id', protect, isAdmin, artworkController.deleteArtwork);

// Novas rotas para aprovação/rejeição por admin
router.put('/:id/approve', protect, isAdmin, artworkController.approveArtwork);
router.put('/:id/reject', protect, isAdmin, artworkController.rejectArtwork);

router.post('/:id/favorite', protect, artworkController.addFavoriteArtwork);

// Remover obra dos favoritos
router.delete('/:id/favorite', protect, artworkController.removeFavoriteArtwork);

// Rota para listar os favoritos do usuário logado - pode ser aqui ou em userRoutes.js
router.get('/user/favorites', protect, artworkController.getFavoriteArtworks); 
// A URL da API seria: GET /api/artworks/user/favorites
router.post('/:id/favorite', protect, artworkController.addFavoriteArtwork);

// Remover uma obra dos favoritos
// DELETE /api/artworks/:id/favorite
router.delete('/:id/favorite', protect, artworkController.removeFavoriteArtwork);

module.exports = router;