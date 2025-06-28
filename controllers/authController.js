// art-gallery-backend-novo/controllers/authController.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Para gerar tokens aleatórios
require('dotenv').config();

// @desc    Registrar um novo usuário e fazer login automaticamente
// @route   POST /api/auth/register
exports.registerUser = async (req, res, next) => {
    const { Name, Email, Password } = req.body;

    // Validações
    if (!Name || !Email || !Password) {
        return res.status(400).json({ error: 'Nome, Email e Senha são obrigatórios.' });
    }
    if (Password.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
    }

    try {
        const [users] = await db.query('SELECT UserID FROM Users WHERE Email = ?', [Email]);
        if (users.length > 0) {
            return res.status(409).json({ error: 'Este email já está cadastrado.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(Password, salt);
        const newUser = { Name, Email, Password: hashedPassword, IsAdmin: false };
        const [result] = await db.query('INSERT INTO Users SET ?', newUser);
        const newUserId = result.insertId;

        // Lógica de login automático após registro
        const payload = {
            userId: newUserId,
            name: Name,
            email: Email,
            isAdmin: false
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });

        let maxAgeMs = 1 * 60 * 60 * 1000; // Default 1 hora
        if (process.env.JWT_EXPIRES_IN) {
            const unit = process.env.JWT_EXPIRES_IN.slice(-1).toLowerCase();
            const value = parseInt(process.env.JWT_EXPIRES_IN.slice(0, -1));
            if (!isNaN(value)) {
                if (unit === 'd') maxAgeMs = value * 24 * 60 * 60 * 1000;
                else if (unit === 'h') maxAgeMs = value * 60 * 60 * 1000;
                else if (unit === 'm') maxAgeMs = value * 60 * 1000;
            }
        }

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            path: '/',
            maxAge: maxAgeMs
        };
        
        res.cookie('jwt', token, cookieOptions);

        res.status(201).json({
            message: 'Usuário registrado com sucesso!',
            token: token,
            user: payload
        });

    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        next(error);
    }
};

// @desc    Login de usuário
// @route   POST /api/auth/login
exports.loginUser = async (req, res, next) => {
    const { Email, Password } = req.body;

    if (!Email || !Password) {
        return res.status(400).json({ error: 'Email e Senha são obrigatórios.' });
    }

    try {
        const [users] = await db.query('SELECT * FROM Users WHERE Email = ?', [Email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(Password, user.Password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const payload = {
            userId: user.UserID,
            name: user.Name,
            email: user.Email,
            isAdmin: user.IsAdmin ? true : false
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });

        let maxAgeMs = 1 * 60 * 60 * 1000; // Default 1 hora
        if (process.env.JWT_EXPIRES_IN) {
            const unit = process.env.JWT_EXPIRES_IN.slice(-1).toLowerCase();
            const value = parseInt(process.env.JWT_EXPIRES_IN.slice(0, -1));
            if (!isNaN(value)) {
                if (unit === 'd') maxAgeMs = value * 24 * 60 * 60 * 1000;
                else if (unit === 'h') maxAgeMs = value * 60 * 60 * 1000;
                else if (unit === 'm') maxAgeMs = value * 60 * 1000;
            }
        }

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            path: '/',
            maxAge: maxAgeMs
        };
        
        res.cookie('jwt', token, cookieOptions);

        res.status(200).json({
            message: 'Login bem-sucedido!',
            token: token,
            user: {
                userId: user.UserID,
                name: user.Name,
                email: user.Email,
                isAdmin: user.IsAdmin ? true : false
            }
        });

    } catch (error) {
        console.error('Erro ao fazer login:', error);
        next(error);
    }
};

// @desc    Logout de usuário
// @route   POST /api/auth/logout
exports.logoutUser = (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        path: '/',
        expires: new Date(0) 
    });
    res.status(200).json({ message: 'Logout bem-sucedido.' });
};

// @desc    Solicitar redefinição de senha
// @route   POST /api/auth/request-password-reset
exports.requestPasswordReset = async (req, res, next) => {
    const { Email } = req.body;

    if (!Email) {
        return res.status(400).json({ error: 'O campo Email é obrigatório.' });
    }

    try {
        const [users] = await db.query('SELECT * FROM Users WHERE Email = ?', [Email]);
        if (users.length === 0) {
            return res.status(200).json({ message: 'Se um usuário com este email existir, instruções para redefinir a senha foram enviadas.' });
        }
        const user = users[0];
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

        await db.query('UPDATE Users SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE UserID = ?', [
            hashedResetToken,
            resetTokenExpires,
            user.UserID
        ]);

        const resetPageUrl = `${req.protocol}://${req.get('host')}/set-new-password-page?token=${resetToken}`; 

        console.log('--------------------------------------------------------------------');
        console.log('SIMULAÇÃO DE ENVIO DE CÓDIGO/LINK PARA REDEFINIÇÃO DE SENHA:');
        console.log(`Para: ${user.Email}`);
        console.log(`Seu código/token de redefinição é: ${resetToken}`);
        console.log(`O link completo para a página de redefinição é: ${resetPageUrl}`);
        console.log('--------------------------------------------------------------------');

        res.status(200).json({ message: 'Se um usuário com este email existir, instruções para redefinir a senha foram enviadas para seu email.' });
    } catch (error) {
        console.error('Erro ao solicitar redefinição de senha:', error);
        res.status(500).json({ error: 'Ocorreu um erro ao processar sua solicitação.' });
    }
};

// @desc    Verificar o token de redefinição
// @route   POST /api/auth/verify-reset-token
exports.verifyResetToken = async (req, res, next) => {
    const { token: submittedToken } = req.body; 
    if (!submittedToken) {
        return res.status(400).json({ error: 'Token é obrigatório.' });
    }
    try {
        const hashedTokenToCompare = crypto.createHash('sha256').update(submittedToken).digest('hex');
        const query = 'SELECT UserID FROM Users WHERE resetPasswordToken = ? AND resetPasswordExpires > NOW()';
        const [users] = await db.query(query, [hashedTokenToCompare]);
        if (users.length === 0) {
            return res.status(400).json({ error: 'Código de redefinição inválido ou expirado.' });
        }
        res.status(200).json({ 
            message: 'Código verificado com sucesso.',
            resetToken: submittedToken
        });
    } catch (error) {
        console.error('Erro ao verificar token de redefinição:', error);
        res.status(500).json({ error: 'Ocorreu um erro ao processar sua solicitação.' });
    }
};

// @desc    Redefinir a senha
// @route   POST /api/auth/reset-password/:token
exports.resetPassword = async (req, res, next) => {
    const resetToken = req.params.token;
    const { Password, ConfirmPassword } = req.body;

    if (!Password || !ConfirmPassword) {
        return res.status(400).json({ error: 'Nova senha e confirmação são obrigatórias.' });
    }
    if (Password !== ConfirmPassword) {
        return res.status(400).json({ error: 'As senhas não coincidem.' });
    }
    if (Password.length < 6) {
        return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }

    try {
        const hashedTokenToCompare = crypto.createHash('sha256').update(resetToken).digest('hex');
        const query = 'SELECT * FROM Users WHERE resetPasswordToken = ? AND resetPasswordExpires > NOW()';
        const [users] = await db.query(query, [hashedTokenToCompare]);

        if (users.length === 0) {
            return res.status(400).json({ error: 'Token de redefinição de senha inválido ou expirado.' });
        }
        const user = users[0];

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(Password, salt);

        await db.query(
            'UPDATE Users SET Password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE UserID = ?',
            [hashedPassword, user.UserID]
        );
        
        res.cookie('jwt', '', { httpOnly: true, path:'/', expires: new Date(0) });

        res.status(200).json({ message: 'Senha redefinida com sucesso! Você já pode fazer login com sua nova senha.' });

    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        res.status(500).json({ error: 'Ocorreu um erro ao processar sua solicitação.' });
    }
};