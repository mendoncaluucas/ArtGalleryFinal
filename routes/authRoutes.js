
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // Para rotas que precisam de usuário logado

// POST /api/auth/register
router.post('/register', authController.registerUser);

// POST /api/auth/login
router.post('/login', authController.loginUser);

// POST /api/auth/logout
router.post('/logout', authController.logoutUser); // Rota para logout, pode ser GET também

router.post('/request-password-reset', authController.requestPasswordReset);

router.post('/verify-reset-token', authController.verifyResetToken);

router.post('/reset-password/:token', authController.resetPassword);

// Exemplo de rota para pegar o perfil do usuário logado via API (útil para SPAs)
router.get('/me', protect, (req, res) => {
    // req.user é populado pelo middleware 'protect'
    if (!req.user) {
        return res.status(401).json({ error: 'Não autorizado' });
    }
    res.json({
        userId: req.user.userId,
        name: req.user.name,
        email: req.user.email,
        isAdmin: req.user.isAdmin
    });
});


module.exports = router;