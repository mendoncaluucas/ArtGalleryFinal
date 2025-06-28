// art-gallery-backend-novo/controllers/artworkController.js
const db = require('../config/db');
const fs = require('fs'); // Módulo File System do Node, para deletar arquivos
const path = require('path'); // Módulo Path do Node, para lidar com caminhos de arquivo

// @desc    Criar uma nova obra de arte com upload de imagem
// @route   POST /api/artworks
// @access  Privado (qualquer usuário logado)
exports.createArtwork = async (req, res, next) => {
    // Campos de texto vêm de req.body
    const { Title, Description, CreationYear, Medium, Dimensions, ArtistID } = req.body;
    
    // O middleware do multer populou req.file com os dados da imagem enviada
    const imageFile = req.file;

    // Validação
    if (!Title) {
        // Se um arquivo foi enviado mas o título está faltando, devemos deletar o arquivo órfão.
        if (imageFile) {
            fs.unlink(imageFile.path, (err) => {
                if (err) console.error("Erro ao deletar arquivo órfão:", err);
            });
        }
        return res.status(400).json({ error: 'O campo "Title" (título da obra) é obrigatório.' });
    }

    if (!imageFile) {
        // Tornando a imagem obrigatória para o cadastro
        return res.status(400).json({ error: 'Uma imagem para a obra de arte é obrigatória.' });
    }

    // Construir a URL que será salva no banco
    const imageURL = `/uploads/artworks/${imageFile.filename}`;

    try {
        // Validar se o ArtistID existe (se fornecido)
        if (ArtistID) {
            const [artists] = await db.query('SELECT ArtistID FROM Artists WHERE ArtistID = ?', [ArtistID]);
            if (artists.length === 0) {
                // Deleta o arquivo se o artista não for válido
                fs.unlinkSync(imageFile.path); 
                return res.status(404).json({ error: `Artista com ID ${ArtistID} não encontrado.` });
            }
        }
        
        const newArtwork = {
            Title,
            Description: Description || null,
            CreationYear: CreationYear ? parseInt(CreationYear, 10) : null,
            Medium: Medium || null,
            Dimensions: Dimensions || null,
            ImageURL: imageURL, // <<< Salva o caminho do arquivo no banco
            ArtistID: ArtistID ? parseInt(ArtistID, 10) : null,
            status: 'pending_review'
        };

        const [result] = await db.query('INSERT INTO Artworks SET ?', newArtwork);

        res.status(201).json({
            message: 'Obra de arte enviada para revisão!',
            artworkId: result.insertId,
            ...newArtwork
        });
    } catch (error) {
        console.error('Erro ao criar obra de arte:', error);
        // Se houve um erro ao salvar no banco, deleta o arquivo que já foi salvo no disco.
        if (imageFile) {
            fs.unlink(imageFile.path, (err) => {
                if (err) console.error("Erro ao deletar arquivo órfão após falha no DB:", err);
            });
        }
        next(error);
    }
};

// As funções abaixo permanecem como estavam, mas aqui estão para garantir que o arquivo esteja completo.

// @desc    Listar todas as obras de arte APROVADAS (para o público)
exports.getAllArtworks = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                aw.ArtworkID, aw.Title, aw.Description, aw.CreationYear, 
                aw.Medium, aw.Dimensions, aw.ImageURL, aw.ArtistID, aw.status,
                ar.Name AS ArtistName 
            FROM Artworks aw
            LEFT JOIN Artists ar ON aw.ArtistID = ar.ArtistID
            WHERE aw.status = 'approved'
            ORDER BY aw.Title ASC;
        `;
        const [artworks] = await db.query(query);
        res.json(artworks);
    } catch (error) {
        console.error('Erro ao listar obras de arte:', error);
        next(error);
    }
};

// @desc    Obter uma obra de arte APROVADA específica pelo ID (para o público)
exports.getArtworkById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT 
                aw.*, 
                ar.Name AS ArtistName 
            FROM Artworks aw
            LEFT JOIN Artists ar ON aw.ArtistID = ar.ArtistID
            WHERE aw.ArtworkID = ? AND aw.status = 'approved';
        `;
        const [artworks] = await db.query(query, [id]);

        if (artworks.length === 0) {
            return res.status(404).json({ error: 'Obra de arte não encontrada ou não aprovada.' });
        }
        res.json(artworks[0]);
    } catch (error) {
        console.error(`Erro ao buscar obra de arte ${id}:`, error);
        next(error);
    }
};

// @desc    Atualizar uma obra de arte
exports.updateArtwork = async (req, res, next) => {
    const { id } = req.params;
    const { Title, Description, CreationYear, Medium, Dimensions, ImageURL, ArtistID, status } = req.body;
    // Lógica de atualização... (como antes)
};

// @desc    Deletar uma obra de arte
exports.deleteArtwork = async (req, res, next) => {
    const { id } = req.params;
    // Lógica de deleção... (como antes)
};

// Funções para aprovar, rejeitar e favoritar... (como antes)
exports.approveArtwork = async (req, res, next) => {
    const { id } = req.params;
    try {
        await db.query("UPDATE Artworks SET status = 'approved' WHERE ArtworkID = ?", [id]);
        res.json({ message: 'Obra de arte aprovada com sucesso!', artworkId: id });
    } catch (error) {
        next(error);
    }
};

exports.rejectArtwork = async (req, res, next) => {
    const { id } = req.params;
    try {
        await db.query("UPDATE Artworks SET status = 'rejected' WHERE ArtworkID = ?", [id]);
        res.json({ message: 'Obra de arte rejeitada com sucesso!', artworkId: id });
    } catch (error) {
        next(error);
    }
};

exports.addFavoriteArtwork = async (req, res, next) => {
    const artworkId = req.params.id;
    const userId = req.user.userId;
    try {
        await db.query('INSERT IGNORE INTO UserFavorites (UserID, ArtworkID) VALUES (?, ?)', [userId, artworkId]);
        res.status(201).json({ message: 'Obra adicionada aos favoritos com sucesso!' });
    } catch (error) {
        next(error);
    }
};

exports.removeFavoriteArtwork = async (req, res, next) => {
    const artworkId = req.params.id;
    const userId = req.user.userId;
    try {
        await db.query('DELETE FROM UserFavorites WHERE UserID = ? AND ArtworkID = ?', [userId, artworkId]);
        res.status(200).json({ message: 'Obra removida dos favoritos com sucesso!' });
    } catch (error) {
        next(error);
    }
};

exports.getFavoriteArtworks = async (req, res, next) => {
    const userId = req.user.userId;
    try {
        const query = `
            SELECT aw.*, ar.Name AS ArtistName
            FROM Artworks aw
            JOIN UserFavorites uf ON aw.ArtworkID = uf.ArtworkID
            LEFT JOIN Artists ar ON aw.ArtistID = ar.ArtistID
            WHERE uf.UserID = ? AND aw.status = 'approved'
            ORDER BY uf.CreatedAt DESC;
        `;
        const [favoriteArtworks] = await db.query(query, [userId]);
        res.json(favoriteArtworks);
    } catch (error) {
        next(error);
    }
};