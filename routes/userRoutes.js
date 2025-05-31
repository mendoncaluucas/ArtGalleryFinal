// art-gallery-backend-novo/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); // Usa o userController
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Rota da API para obter o perfil do usuário logado (retorna JSON)
// GET /api/users/profile
router.get('/profile', protect, userController.getUserProfile);

// Rota da API para ATUALIZAR o perfil do usuário logado (retorna JSON)
// PUT /api/users/me
router.put('/me', protect, userController.updateUserProfile);

// --- Rotas de Admin para gerenciamento de usuários (API JSON) ---

// Rota da API para listar todos os usuários (somente admins, retorna JSON)
// GET /api/users
router.get('/', protect, isAdmin, userController.getAllUsers);

// Rota da API para atualizar o status de admin de um usuário (somente admins, retorna JSON)
// PUT /api/users/:userId/admin
router.put('/:userId/admin', protect, isAdmin, userController.updateUserAdminStatus);

// Adicionar aqui a rota para deletar usuário se necessário (ex: DELETE /api/users/:userId)
// router.delete('/:userId', protect, isAdmin, userController.deleteUser); 
// (Lembre-se de criar a função deleteUser no userController se for usar)

// Rota da API para buscar usuários por nome (somente admins, retorna JSON)
// GET /api/users/search?name=TEXTO
// (Esta rota precisa da função searchUsersByName no userController.js)
// router.get('/search', protect, isAdmin, userController.searchUsersByName);


module.exports = router;