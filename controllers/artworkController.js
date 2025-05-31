// art-gallery-backend-novo/controllers/artworkController.js
const db = require('../config/db');

// @desc    Criar uma nova obra de arte
// @route   POST /api/artworks
// @access  Privado (qualquer usuário logado)

exports.createArtwork = async (req, res, next) => {
    // Campos de texto virão de req.body
    const { Title, Description, CreationYear, Medium, Dimensions, ArtistID } = req.body;
    
    // Informações do arquivo (se enviado) virão de req.file
    // req.file é populado pelo middleware do multer: uploadArtworkImage.single('artworkImage')
    
    if (!Title) {
        // Se houver um arquivo já salvo pelo multer e der erro aqui, idealmente deveríamos excluí-lo.
        // if (req.file) {
        //     fs.unlinkSync(req.file.path); // Exige importação do 'fs'
        // }
        return res.status(400).json({ error: 'O campo "Title" (título da obra) é obrigatório.' });
    }

    let imageURL = null; // Default para null se nenhuma imagem for enviada
    if (req.file) {
        // Construímos a URL para acessar a imagem.
        // A pasta 'public/uploads/artworks' é servida como '/uploads/artworks'
        // devido ao app.use(express.static(path.join(__dirname, 'public'))); no server.js
        // e à configuração do multer.
        imageURL = `/uploads/artworks/${req.file.filename}`;
    } else {
        // Se o design do Figma IMPLICA uma imagem mas o backend pode aceitar sem,
        // você pode querer retornar um erro se req.file não existir.
        // Ou, se a imagem for opcional ou puder ser uma URL externa ainda:
        // imageURL = req.body.ImageURL_externa || null; // Se você tiver um campo para URL externa
        // Por agora, se não houver upload, imageURL será null ou o que vier do corpo (se houver).
        // Para o design com upload, é provável que uma imagem seja esperada.
        // Vamos manter assim, mas o ideal é que o frontend envie o arquivo.
        // Se o campo ImageURL do seu HTML for preenchido quando não há upload, ele virá em req.body.ImageURL
        if (req.body.ImageURL) { // Se o usuário colou uma URL em vez de fazer upload
            imageURL = req.body.ImageURL;
        }
    }
    
    if (ArtistID) {
        try {
            const [artists] = await db.query('SELECT ArtistID FROM Artists WHERE ArtistID = ?', [ArtistID]);
            if (artists.length === 0) {
                // if (req.file) fs.unlinkSync(req.file.path); // Excluir arquivo se artista não existe
                return res.status(404).json({ error: `Artista com ID ${ArtistID} não encontrado.` });
            }
        } catch (dbError) {
            console.error('Erro ao verificar artista na criação da obra:', dbError);
            // if (req.file) fs.unlinkSync(req.file.path);
            return next(dbError);
        }
    }

    try {
        const newArtwork = {
            Title,
            Description: Description || null,
            CreationYear: CreationYear ? parseInt(CreationYear) : null,
            Medium: Medium || null,
            Dimensions: Dimensions || null,
            ImageURL: imageURL, // Usar a URL gerada pelo upload ou a fornecida
            ArtistID: ArtistID ? parseInt(ArtistID) : null,
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
        // Se um arquivo foi salvo mas houve erro ao inserir no DB, exclua o arquivo órfão
        // if (req.file) {
        //     try {
        //         fs.unlinkSync(req.file.path);
        //         console.log('Arquivo de upload órfão removido:', req.file.path);
        //     } catch (unlinkErr) {
        //         console.error('Erro ao remover arquivo de upload órfão:', unlinkErr);
        //     }
        // }
        next(error);
    }
};

exports.createArtwork = async (req, res, next) => {
    const { Title, Description, CreationYear, Medium, Dimensions, ImageURL, ArtistID } = req.body;

    if (!Title) {
        return res.status(400).json({ error: 'O campo "Title" (título da obra) é obrigatório.' });
    }

    if (ArtistID) {
        try {
            const [artists] = await db.query('SELECT ArtistID FROM Artists WHERE ArtistID = ?', [ArtistID]);
            if (artists.length === 0) {
                return res.status(404).json({ error: `Artista com ID ${ArtistID} não encontrado.` });
            }
        } catch (dbError) {
            console.error('Erro ao verificar artista na criação da obra:', dbError);
            // Não chame next(dbError) aqui se quiser que o try/catch principal pegue o erro da query de insert.
            // Ou, se for um erro crítico que impede a continuação:
            // return next(dbError); 
        }
    }

    try {
        const newArtwork = {
            Title,
            Description: Description || null,
            CreationYear: CreationYear || null,
            Medium: Medium || null,
            Dimensions: Dimensions || null,
            ImageURL: ImageURL || null,
            ArtistID: ArtistID || null,
            status: 'pending_review' // Status inicial padrão
        };
        const [result] = await db.query('INSERT INTO Artworks SET ?', newArtwork);

        res.status(201).json({
            message: 'Obra de arte enviada para revisão!',
            artworkId: result.insertId,
            ...newArtwork
        });
    } catch (error) {
        console.error('Erro ao criar obra de arte:', error);
        next(error);
    }
};

// @desc    Listar todas as obras de arte APROVADAS (para o público)
// @route   GET /api/artworks
// @access  Público
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
// @route   GET /api/artworks/:id
// @access  Público
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
// @route   PUT /api/artworks/:id
// @access  Privado/Admin
exports.updateArtwork = async (req, res, next) => {
    const { id } = req.params;
    // Incluindo 'status' entre os campos que podem ser atualizados por um admin
    const { Title, Description, CreationYear, Medium, Dimensions, ImageURL, ArtistID, status } = req.body;

    const fieldsToUpdate = {};
    if (Title !== undefined) fieldsToUpdate.Title = Title;
    if (Description !== undefined) fieldsToUpdate.Description = Description;
    if (CreationYear !== undefined) fieldsToUpdate.CreationYear = CreationYear;
    if (Medium !== undefined) fieldsToUpdate.Medium = Medium;
    if (Dimensions !== undefined) fieldsToUpdate.Dimensions = Dimensions;
    if (ImageURL !== undefined) fieldsToUpdate.ImageURL = ImageURL;
    
    if (status !== undefined) {
        const allowedStatuses = ['pending_review', 'approved', 'rejected'];
        if (allowedStatuses.includes(status)) {
            fieldsToUpdate.status = status;
        } else {
            return res.status(400).json({ error: `Status inválido. Permitidos: ${allowedStatuses.join(', ')}` });
        }
    }
    
    if (ArtistID !== undefined) {
        if (ArtistID !== null) { // Permite ArtistID ser null para desassociar
            try {
                const [artists] = await db.query('SELECT ArtistID FROM Artists WHERE ArtistID = ?', [ArtistID]);
                if (artists.length === 0) {
                    return res.status(404).json({ error: `Artista com ID ${ArtistID} não encontrado para associação.` });
                }
            } catch (dbError) {
                console.error('Erro ao verificar artista na atualização da obra:', dbError);
                // return next(dbError); // Decide se quer parar aqui ou deixar o update tentar
            }
        }
        fieldsToUpdate.ArtistID = ArtistID;
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({ error: 'Nenhum dado fornecido para atualização.' });
    }

    try {
        const [result] = await db.query('UPDATE Artworks SET ? WHERE ArtworkID = ?', [fieldsToUpdate, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Obra de arte não encontrada para atualização.' });
        }
        if (result.changedRows === 0 && result.affectedRows > 0) {
             return res.json({ message: 'Nenhum dado da obra foi alterado.', artworkId: id });
        }

        res.json({ message: 'Obra de arte atualizada com sucesso!', artworkId: id, updatedFields: fieldsToUpdate });
    } catch (error) {
        console.error(`Erro ao atualizar obra de arte ${id}:`, error);
        next(error);
    }
};

// @desc    Deletar uma obra de arte
// @route   DELETE /api/artworks/:id
// @access  Privado/Admin
exports.deleteArtwork = async (req, res, next) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM Artworks WHERE ArtworkID = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Obra de arte não encontrada para exclusão.' });
        }
        res.status(200).json({ message: 'Obra de arte deletada com sucesso.', artworkId: id });
    } catch (error) {
        console.error(`Erro ao deletar obra de arte ${id}:`, error);
        next(error);
    }
};

// @desc    Aprovar uma obra de arte
// @route   PUT /api/artworks/:id/approve
// @access  Privado/Admin
exports.approveArtwork = async (req, res, next) => {
    const { id } = req.params;
    try {
        const [currentArtwork] = await db.query("SELECT status FROM Artworks WHERE ArtworkID = ?", [id]);
        if (currentArtwork.length === 0) {
            return res.status(404).json({ error: 'Obra de arte não encontrada.' });
        }
        
        const [result] = await db.query("UPDATE Artworks SET status = 'approved' WHERE ArtworkID = ?", [id]);
        if (result.affectedRows === 0 && currentArtwork[0].status !== 'approved') { 
            // Se não afetou linhas mas o status não era 'approved', algo deu errado.
            // Se já era 'approved', affectedRows pode ser 0 mas está ok.
            return res.status(404).json({ error: 'Obra de arte não encontrada ou status não pôde ser alterado.' });
        }
        res.json({ message: 'Obra de arte aprovada com sucesso!', artworkId: id });
    } catch (error) {
        console.error(`Erro ao aprovar obra de arte ${id}:`, error);
        next(error);
    }
};

// @desc    Rejeitar uma obra de arte
// @route   PUT /api/artworks/:id/reject
// @access  Privado/Admin
exports.rejectArtwork = async (req, res, next) => {
    const { id } = req.params;
    try {
        const [currentArtwork] = await db.query("SELECT status FROM Artworks WHERE ArtworkID = ?", [id]);
        if (currentArtwork.length === 0) {
            return res.status(404).json({ error: 'Obra de arte não encontrada.' });
        }

        const [result] = await db.query("UPDATE Artworks SET status = 'rejected' WHERE ArtworkID = ?", [id]);
        if (result.affectedRows === 0 && currentArtwork[0].status !== 'rejected') {
            return res.status(404).json({ error: 'Obra de arte não encontrada ou status não pôde ser alterado.' });
        }
        res.json({ message: 'Obra de arte rejeitada com sucesso!', artworkId: id });
    } catch (error) {
        console.error(`Erro ao rejeitar obra de arte ${id}:`, error);
        next(error);
    }
};

exports.requestPasswordReset = async (req, res, next) => {
    const { Email } = req.body;

    if (!Email) {
        return res.status(400).json({ error: 'O campo Email é obrigatório.' });
    }

    try {
        const [users] = await db.query('SELECT * FROM Users WHERE Email = ?', [Email]);

        if (users.length === 0) {
            // Não revele se o email existe ou não por segurança.
            // Envie uma mensagem genérica.
            return res.status(200).json({ message: 'Se um usuário com este email existir, um link para redefinir a senha foi enviado.' });
        }

        const user = users[0];

        // Gerar token de redefinição
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex'); // Armazenar hash do token

        // Definir tempo de expiração do token (ex: 10 minutos)
        const resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos a partir de agora

        // Salvar o token hasheado e a data de expiração no usuário
        await db.query('UPDATE Users SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE UserID = ?', [
            hashedResetToken,
            resetTokenExpires,
            user.UserID
        ]);

        // Construir o link de redefinição (para o frontend - ainda não temos essa página EJS)
        // O frontend (página EJS de redefinição) precisará de uma rota como /reset-password/:token
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`; // Este :token será o token original, não o hasheado

        // **SIMULAÇÃO DE ENVIO DE EMAIL (PARA DESENVOLVIMENTO)**
        // Em produção, você usaria um serviço de email aqui (SendGrid, Mailgun, Nodemailer)
        console.log('--------------------------------------------------------------------');
        console.log('SIMULAÇÃO DE ENVIO DE EMAIL PARA REDEFINIÇÃO DE SENHA:');
        console.log(`Para: ${user.Email}`);
        console.log(`Link de Redefinição (use o token no final do link na próxima etapa): ${resetUrl}`);
        console.log('Token original (para usar na URL):', resetToken);
        console.log('Token hasheado (armazenado no DB):', hashedResetToken);
        console.log('--------------------------------------------------------------------');

        // Enviar resposta para o usuário
        res.status(200).json({ message: 'Se um usuário com este email existir, um link para redefinir a senha foi enviado para seu email.' });

    } catch (error) {
        console.error('Erro ao solicitar redefinição de senha:', error);
        // Não envie o erro detalhado para o cliente em caso de falha de DB, etc.
        res.status(500).json({ error: 'Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.' });
        // next(error); // Descomente se quiser que o globalErrorHandler pegue, mas a msg acima é mais segura.
    }
};

exports.addFavoriteArtwork = async (req, res, next) => {
    const artworkId = req.params.id;
    const userId = req.user.userId; // Do middleware 'protect'

    try {
        // Verificar se a obra existe e está aprovada (opcional, mas bom)
        const [artworks] = await db.query("SELECT ArtworkID FROM Artworks WHERE ArtworkID = ? AND status = 'approved'", [artworkId]);
        if (artworks.length === 0) {
            return res.status(404).json({ error: 'Obra de arte não encontrada ou não disponível.' });
        }

        // Inserir na tabela UserFavorites, ignorar se já existir (devido à UNIQUE KEY)
        await db.query('INSERT IGNORE INTO UserFavorites (UserID, ArtworkID) VALUES (?, ?)', [userId, artworkId]);
        
        res.status(200).json({ message: 'Obra adicionada aos favoritos com sucesso!' });
    } catch (error) {
        console.error('Erro ao adicionar obra aos favoritos:', error);
        next(error);
    }
};

// @desc    Remover uma obra dos favoritos do usuário
// @route   DELETE /api/artworks/:id/favorite
// @access  Privado
exports.removeFavoriteArtwork = async (req, res, next) => {
    const artworkId = req.params.id;
    const userId = req.user.userId;

    try {
        const [result] = await db.query('DELETE FROM UserFavorites WHERE UserID = ? AND ArtworkID = ?', [userId, artworkId]);
        
        if (result.affectedRows === 0) {
            // Pode significar que não era um favorito ou a obra/usuário não existe para essa combinação
            return res.status(404).json({ error: 'Favorito não encontrado ou já removido.' });
        }
        res.status(200).json({ message: 'Obra removida dos favoritos com sucesso!' });
    } catch (error) {
        console.error('Erro ao remover obra dos favoritos:', error);
        next(error);
    }
};

// @desc    Listar obras favoritas do usuário logado
// @route   GET /api/users/me/favorites  (ou podemos criar /api/favorites)
// @access  Privado
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
        console.error('Erro ao listar obras favoritas:', error);
        next(error);
    }
};

exports.addFavoriteArtwork = async (req, res, next) => {
    const artworkId = req.params.id;
    const userId = req.user.userId; // Vem do middleware 'protect'

    try {
        // 1. Verificar se a obra de arte existe e está aprovada (opcional, mas recomendado)
        const [artworks] = await db.query("SELECT ArtworkID FROM Artworks WHERE ArtworkID = ? AND status = 'approved'", [artworkId]);
        if (artworks.length === 0) {
            return res.status(404).json({ error: 'Obra de arte não encontrada ou não disponível para ser favoritada.' });
        }

        // 2. Tentar inserir o favorito. A UNIQUE KEY no banco impedirá duplicados.
        // Usar INSERT IGNORE para não dar erro se o favorito já existir.
        const [result] = await db.query('INSERT IGNORE INTO UserFavorites (UserID, ArtworkID) VALUES (?, ?)', [userId, artworkId]);
        
        if (result.affectedRows === 0 && result.insertId === 0) {
            // Se affectedRows é 0 E insertId é 0, significa que já era um favorito (INSERT IGNORE não inseriu nada novo).
             return res.status(200).json({ message: 'Obra já estava nos favoritos.' });
        }

        res.status(201).json({ message: 'Obra adicionada aos favoritos com sucesso!' }); // 201 para criação, ou 200 se considerar idempotente.
    } catch (error) {
        console.error('Erro ao adicionar obra aos favoritos:', error);
        next(error);
    }
};

// @desc    Remover uma obra dos favoritos do usuário
// @route   DELETE /api/artworks/:id/favorite
// @access  Privado (requer usuário logado)
exports.removeFavoriteArtwork = async (req, res, next) => {
    const artworkId = req.params.id;
    const userId = req.user.userId; // Vem do middleware 'protect'

    try {
        const [result] = await db.query('DELETE FROM UserFavorites WHERE UserID = ? AND ArtworkID = ?', [userId, artworkId]);
        
        if (result.affectedRows === 0) {
            // Isso pode significar que a obra não estava favoritada por este usuário.
            return res.status(404).json({ error: 'Favorito não encontrado para este usuário e obra, ou já removido.' });
        }
        res.status(200).json({ message: 'Obra removida dos favoritos com sucesso!' });
    } catch (error) {
        console.error('Erro ao remover obra dos favoritos:', error);
        next(error);
    }
};

// @desc    Listar obras favoritas do usuário logado
// @route   GET /api/artworks/user/favorites (ou /api/users/me/favorites se mover para userController)
// @access  Privado (requer usuário logado)
exports.getFavoriteArtworks = async (req, res, next) => {
    const userId = req.user.userId; // Vem do middleware 'protect'

    try {
        const query = `
            SELECT 
                aw.ArtworkID, aw.Title, aw.Description, aw.CreationYear, 
                aw.Medium, aw.Dimensions, aw.ImageURL, aw.status,
                ar.Name AS ArtistName 
            FROM Artworks aw
            JOIN UserFavorites uf ON aw.ArtworkID = uf.ArtworkID
            LEFT JOIN Artists ar ON aw.ArtistID = ar.ArtistID
            WHERE uf.UserID = ? AND aw.status = 'approved' 
            ORDER BY uf.CreatedAt DESC; 
        `;
        // Apenas obras aprovadas podem ser listadas como favoritas
        // Ordena pelas mais recentemente favoritadas
        const [favoriteArtworks] = await db.query(query, [userId]);
        
        res.status(200).json(favoriteArtworks);
    } catch (error) {
        console.error('Erro ao listar obras favoritas:', error);
        next(error);
    }
};