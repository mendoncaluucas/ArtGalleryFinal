// art-gallery-backend-novo/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const protect = async (req, res, next) => {
    let token;
    let tokenSource = ''; // Para debug

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            tokenSource = 'header';
        } catch (error) {
            console.error("Erro ao processar Bearer token do header:", error);
            // Não retorna ainda, pode haver cookie
        }
    } 
    
    if (!token && req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
        tokenSource = 'cookie';
    }

    const isHtmlRequest = req.accepts(['html', 'json']) === 'html' && (!req.path.startsWith('/api') || req.originalUrl.startsWith('/api/auth/logout'));


    if (!token) {
        if (isHtmlRequest) {
            // Para páginas EJS, redirecionar para uma página de login EJS
            // Se não tiver uma, pode enviar um HTML de erro simples.
            // Assumindo que você tem uma rota GET /login que renderiza login.ejs
            return res.redirect('/login?message=Por favor, faça login para continuar.');
        }
        return res.status(401).json({ error: 'Não autorizado. Nenhum token fornecido.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { // Garante que isAdmin seja booleano
            ...decoded,
            isAdmin: decoded.isAdmin ? true : false
        };
        // console.log(`Token verificado com sucesso via ${tokenSource}. User:`, req.user);
        next();
    } catch (error) {
        console.error(`Erro na autenticação do token (fonte: ${tokenSource}):`, error.message);
        let errorMessage = 'Não autorizado. Problema com o token.';
        if (error.name === 'JsonWebTokenError') {
            errorMessage = 'Token inválido. Acesso não autorizado.';
        } else if (error.name === 'TokenExpiredError') {
            errorMessage = 'Token expirado. Por favor, faça login novamente.';
        }
        
        if (isHtmlRequest) {
            // Limpa o cookie inválido/expirado
            res.cookie('jwt', '', { httpOnly: true, path:'/', expires: new Date(0) });
            return res.redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
        }
        return res.status(401).json({ error: errorMessage });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin === true) { // Verifica explicitamente por true
        next(); 
    } else {
        const isHtmlRequest = req.accepts(['html', 'json']) === 'html' && !req.path.startsWith('/api');
        const errorMessage = 'Acesso negado. Requer privilégios de administrador.';
        if (isHtmlRequest) {
             // Redirecionar para uma página de "não autorizado" ou home
            return res.status(403).send(`<html><body><h1>Acesso Negado</h1><p>${errorMessage}</p><a href="/">Voltar</a></body></html>`);
        }
        res.status(403).json({ error: errorMessage }); 
    }
};

module.exports = { protect, isAdmin };