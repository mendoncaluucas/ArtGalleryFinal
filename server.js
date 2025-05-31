// art-gallery-backend-novo/server.js

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // <<< ADICIONADO

const db = require('./config/db');
const apiRoutes = require('./routes/index');
const pageRoutes = require('./routes/pageRoutes');
const { notFound, globalErrorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cors({
    origin: `http://localhost:${process.env.FRONTEND_PORT || 5173}`, // Se seu frontend React estiver em outra porta e precisar de cookies
    credentials: true // Necessário para enviar cookies entre domínios/portas diferentes
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // <<< USANDO O COOKIE PARSER
app.use(express.static(path.join(__dirname, 'public')));

// ROTAS
app.use('/', pageRoutes); // Rotas que servem páginas EJS
app.use('/api', apiRoutes); // Rotas da API JSON

// Error Handlers
app.use(notFound);
app.use(globalErrorHandler);

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});