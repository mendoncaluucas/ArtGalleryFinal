const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Diretório para salvar as imagens das obras
const artworkUploadDir = path.join(__dirname, '..', 'public', 'uploads', 'artworks');

// Certifique-se de que o diretório de upload existe
if (!fs.existsSync(artworkUploadDir)) {
    fs.mkdirSync(artworkUploadDir, { recursive: true });
}

// Configuração de armazenamento para o Multer
const artworkStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, artworkUploadDir); // Pasta onde os arquivos serão salvos
    },
    filename: function (req, file, cb) {
        // Define o nome do arquivo: campo original + timestamp + extensão original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtro de arquivos para aceitar apenas imagens
const imageFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Por favor, envie apenas arquivos de imagem (jpeg, png, gif, webp)!'), false);
    }
};

const uploadArtworkImage = multer({ 
    storage: artworkStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Limite de 5MB por arquivo
});

module.exports = { uploadArtworkImage };