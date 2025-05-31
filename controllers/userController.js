// art-gallery-backend-novo/controllers/userController.js
const db = require('../config/db');

// @desc    Obter perfil do usuário logado
// @route   GET /api/users/profile
// @access  Privado (requer token)
exports.getUserProfile = async (req, res, next) => {
    // O middleware 'protect' já decodificou o token e colocou os dados em req.user
    if (req.user) {
        res.json({
            userId: req.user.userId,
            name: req.user.name,
            email: req.user.email,
            isAdmin: req.user.isAdmin
        });
    } else {
        res.status(404).json({ error: 'Usuário não encontrado ou não autenticado.' });
    }
};

// ---- NOVA FUNÇÃO: Listar todos os usuários ----
// @desc    Listar todos os usuários (para admins)
// @route   GET /api/users
// @access  Privado/Admin
exports.getAllUsers = async (req, res, next) => {
    try {
        // Seleciona campos relevantes para a listagem de permissões
        const [users] = await db.query('SELECT UserID, Name, Email, IsAdmin, CreatedAt FROM Users ORDER BY Name ASC');
        res.json(users);
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        error.statusCode = error.statusCode || 500;
        error.message = error.message || 'Erro interno do servidor ao listar usuários.';
        next(error);
    }
};

// ---- NOVA FUNÇÃO: Atualizar status de admin de um usuário ----
// @desc    Atualizar o status de admin de um usuário (para admins)
// @route   PUT /api/users/:userId/admin
// @access  Privado/Admin
exports.updateUserAdminStatus = async (req, res, next) => {
    const { userId } = req.params; // ID do usuário a ser modificado
    const { isAdmin } = req.body;  // Novo status de admin (true ou false)

    // Validação básica
    if (typeof isAdmin !== 'boolean') {
        return res.status(400).json({ error: 'O campo "isAdmin" é obrigatório e deve ser um booleano (true/false).' });
    }

    // Impede que um admin se despromova (opcional, mas uma boa prática)
    // req.user vem do middleware 'protect' e é o admin fazendo a requisição
    if (Number(req.user.userId) === Number(userId) && !isAdmin) {
         return res.status(400).json({ error: 'Um administrador não pode remover seus próprios privilégios de administrador.' });
    }
    // Ou, se você quiser permitir, remova o if acima.
    // No entanto, é mais seguro impedir que o último admin se despromova,
    // mas essa lógica seria mais complexa (contar quantos admins existem).

    try {
        const [result] = await db.query('UPDATE Users SET IsAdmin = ? WHERE UserID = ?', [isAdmin, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado com o ID fornecido.' });
        }

        res.json({ message: `Status de administrador do usuário ${userId} atualizado para ${isAdmin}.` });

    } catch (error) {
        console.error(`Erro ao atualizar status de admin para usuário ${userId}:`, error);
        error.statusCode = error.statusCode || 500;
        error.message = error.message || 'Erro interno do servidor ao atualizar status de admin.';
        next(error);
    }
};

exports.updateUserProfile = async (req, res, next) => {
    const { Name } = req.body;
    const userId = req.user.userId; // Do middleware 'protect'

    if (!Name || Name.trim() === '') {
        return res.status(400).json({ error: 'O campo Nome é obrigatório.' });
    }

    try {
        const [result] = await db.query('UPDATE Users SET Name = ? WHERE UserID = ?', [Name, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        // Retornar o usuário atualizado (sem a senha)
        const [updatedUsers] = await db.query('SELECT UserID, Name, Email, IsAdmin FROM Users WHERE UserID = ?', [userId]);
        
        res.json({ 
            message: 'Perfil atualizado com sucesso!',
            user: {
                userId: updatedUsers[0].UserID,
                name: updatedUsers[0].Name,
                email: updatedUsers[0].Email,
                isAdmin: updatedUsers[0].IsAdmin ? true : false
            }
        });
    } catch (error) {
        console.error('Erro ao atualizar perfil do usuário:', error);
        next(error);
    }
};