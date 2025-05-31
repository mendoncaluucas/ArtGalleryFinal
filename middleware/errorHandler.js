// art-gallery-backend-novo/middleware/errorHandler.js

const notFound = (req, res, next) => {
    res.status(404).json({ error: 'Oops! Rota não encontrada.' });
};

const globalErrorHandler = (err, req, res, next) => {
    console.error('UM ERRO OCORREU:', err.stack);
    res.status(err.status || 500).json({
        error: err.message || 'Algo deu muito errado no servidor!',
    });
};

module.exports = { notFound, globalErrorHandler }; 