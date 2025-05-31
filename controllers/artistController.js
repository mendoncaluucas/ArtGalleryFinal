// art-gallery-backend-novo/controllers/artistController.js
const db = require('../config/db');

// @desc    Criar um novo artista
// @route   POST /api/artists
// @access  Privado/Admin
exports.createArtist = async (req, res, next) => {
    const { Name, Biography, Nationality, BirthYear, DeceasedYear } = req.body;

    if (!Name) {
        return res.status(400).json({ error: 'O campo "Name" (nome do artista) é obrigatório.' });
    }

    try {
        const newArtist = { Name, Biography, Nationality, BirthYear, DeceasedYear };
        const [result] = await db.query('INSERT INTO Artists SET ?', newArtist);

        res.status(201).json({
            message: 'Artista criado com sucesso!',
            artistId: result.insertId,
            ...newArtist // Retorna os dados do artista criado
        });
    } catch (error) {
        console.error('Erro ao criar artista:', error);
        next(error); // Passa para o globalErrorHandler
    }
};

// @desc    Listar todos os artistas
// @route   GET /api/artists
// @access  Público
exports.getAllArtists = async (req, res, next) => {
    try {
        const [artists] = await db.query('SELECT * FROM Artists ORDER BY Name ASC');
        res.json(artists);
    } catch (error){
        console.error('Erro ao listar artistas:', error);
        next(error);
    }
};

// @desc    Obter um artista específico pelo ID
// @route   GET /api/artists/:id
// @access  Público
exports.getArtistById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const [artists] = await db.query('SELECT * FROM Artists WHERE ArtistID = ?', [id]);

        if (artists.length === 0) {
            return res.status(404).json({ error: 'Artista não encontrado.' });
        }
        res.json(artists[0]);
    } catch (error) {
        console.error(`Erro ao buscar artista ${id}:`, error);
        next(error);
    }
};

// @desc    Atualizar um artista
// @route   PUT /api/artists/:id
// @access  Privado/Admin
exports.updateArtist = async (req, res, next) => {
    const { id } = req.params;
    const { Name, Biography, Nationality, BirthYear, DeceasedYear } = req.body;

    if (!Name) {
        // Em uma atualização, você pode querer permitir atualizações parciais,
        // mas para este exemplo, vamos manter o nome como obrigatório se fornecido para atualização.
        // Se o nome não estiver no corpo, ele não será atualizado.
        // No entanto, se o nome for uma string vazia, isso pode ser um problema.
        // Uma validação mais robusta seria necessária para um cenário real.
    }

    // Monta um objeto apenas com os campos que foram fornecidos para atualização
    const fieldsToUpdate = {};
    if (Name !== undefined) fieldsToUpdate.Name = Name;
    if (Biography !== undefined) fieldsToUpdate.Biography = Biography;
    if (Nationality !== undefined) fieldsToUpdate.Nationality = Nationality;
    if (BirthYear !== undefined) fieldsToUpdate.BirthYear = BirthYear;
    if (DeceasedYear !== undefined) fieldsToUpdate.DeceasedYear = DeceasedYear;
    
    // Adiciona o UpdatedAt para ser atualizado automaticamente pelo MySQL (se configurado na tabela)
    // ou manualmente: fieldsToUpdate.UpdatedAt = new Date();


    if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({ error: 'Nenhum dado fornecido para atualização.' });
    }
    // Adiciona a data de atualização, já que o ON UPDATE CURRENT_TIMESTAMP cuida disso
    // fieldsToUpdate.UpdatedAt = new Date(); // Ou deixe o MySQL lidar com isso

    try {
        const [result] = await db.query('UPDATE Artists SET ? WHERE ArtistID = ?', [fieldsToUpdate, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Artista não encontrado para atualização.' });
        }
        if (result.changedRows === 0 && result.affectedRows > 0) {
             return res.json({ message: 'Nenhum dado do artista foi alterado (valores iguais aos existentes).', artistId: id });
        }

        res.json({ message: 'Artista atualizado com sucesso!', artistId: id, updatedFields: fieldsToUpdate });
    } catch (error) {
        console.error(`Erro ao atualizar artista ${id}:`, error);
        next(error);
    }
};

// @desc    Deletar um artista
// @route   DELETE /api/artists/:id
// @access  Privado/Admin
exports.deleteArtist = async (req, res, next) => {
    const { id } = req.params;
    try {
        // Opcional: verificar se existem obras de arte associadas a este artista
        // e decidir o que fazer (impedir exclusão, excluir obras, desassociar obras).
        // A FK na tabela Artworks está como ON DELETE SET NULL, então as obras ficarão sem artista.

        const [result] = await db.query('DELETE FROM Artists WHERE ArtistID = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Artista não encontrado para exclusão.' });
        }
        res.status(200).json({ message: 'Artista deletado com sucesso.', artistId: id });
    } catch (error) {
        console.error(`Erro ao deletar artista ${id}:`, error);
        next(error);
    }
};