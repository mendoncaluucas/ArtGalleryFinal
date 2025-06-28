// art-gallery-backend-novo/routes/pageRoutes.js
const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController'); // Usa o pageController
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Rota para a página inicial (Galeria)
router.get('/', pageController.renderHomePage);

// Rota para a página de login EJS
router.get('/login', pageController.renderLoginPage);

// Rota para a página de cadastro (registro) EJS
router.get('/register', pageController.renderRegisterPage);

// Rota para a página de solicitação de redefinição de senha EJS
router.get('/request-password-reset', pageController.renderRequestPasswordResetPage);

// Rota para a página EJS de inserir código de redefinição
router.get('/enter-reset-token', pageController.renderEnterResetTokenPage);

// Rota para a página EJS de efetiva redefinição de senha
router.get('/set-new-password-page', pageController.renderSetNewPasswordPage);

router.get('/artists', pageController.renderArtistsListPage);

// ---- ROTA PARA A PÁGINA DE PERFIL DO USUÁRIO (EJS) ----
// Acessível por qualquer usuário logado para ver seu próprio perfil
router.get('/profile', protect, pageController.renderUserProfilePage);


// --- Rotas de Admin (Páginas EJS) ---
router.get('/admin/permissions', protect, isAdmin, pageController.renderPermissionsPage);
router.get('/admin/artists/new', protect, isAdmin, pageController.renderNewArtistForm);
router.get('/admin/artworks/validate', protect, isAdmin, pageController.renderArtworkValidationPage);
router.get('/dashboard', protect, isAdmin, pageController.renderDashboardPage);
router.get('/admin/management', protect, isAdmin, pageController.renderManagementPage);

// --- Rotas de Usuário Logado (Páginas EJS) ---
router.get('/artworks/new', protect, pageController.renderNewArtworkForm);
router.get('/favorites', protect, pageController.renderFavoritesPage);

// --- Rotas Públicas de Detalhes (Páginas EJS) ---
router.get('/artists/:artistId/details', pageController.renderArtistDetailPage);
router.get('/artworks/:artworkId/details-public', pageController.renderArtworkDetailPagePublic);


module.exports = router;