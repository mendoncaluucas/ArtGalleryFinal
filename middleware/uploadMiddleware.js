// art-gallery-backend-novo/middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define o diretório onde as imagens das obras serão salvas
const artworkUploadDir = path.join(__dirname, '..', 'public', 'uploads', 'artworks');

// Garante que o diretório de upload exista. Se não, ele o cria.
if (!fs.existsSync(artworkUploadDir)) {
    fs.mkdirSync(artworkUploadDir, { recursive: true });
}

// Configuração de armazenamento para o Multer
const artworkStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, artworkUploadDir); // Pasta de destino dos arquivos
    },
    filename: function (req, file, cb) {
        // Gera um nome de arquivo único para evitar conflitos
        // Ex: artworkImage-1622485338999-54321.jpg
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});

// Filtro de arquivos para aceitar apenas formatos de imagem comuns
const imageFileFilter = (req, file, cb) => {
    // Expressão regular para verificar a extensão do arquivo
    if (file.mimetype.startsWith('image/')) {
        cb(null, true); // Aceita o arquivo
    } else {
        // Rejeita o arquivo com uma mensagem de erro
        cb(new Error('Por favor, envie apenas arquivos de imagem (ex: .jpeg, .png, .gif)!'), false);
    }
};

// Cria a instância do multer com as configurações
const uploadArtworkImage = multer({ 
    storage: artworkStorage,
    fileFilter: imageFileFilter,
    limits: { 
        fileSize: 5 * 1024 * 1024 // Limite de tamanho do arquivo: 5MB
    }
});

// Exporta o middleware para ser usado nas rotas
module.exports = { uploadArtworkImage };