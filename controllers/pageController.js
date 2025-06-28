
const db = require('../config/db');
const jwt = require('jsonwebtoken'); // Necessário para getLoggedInUser
require('dotenv').config();

// Função auxiliar para verificar se o usuário está logado e obter dados do token
const getLoggedInUser = (req) => {
    if (req.cookies && req.cookies.jwt) {
        try {
            const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);
            return { ...decoded, isAdmin: decoded.isAdmin ? true : false }; 
        } catch (error) {
            // console.error('Cookie JWT inválido ou expirado em getLoggedInUser:', error.message); // Log opcional
            return null;
        }
    }
    return null;
};

exports.renderHomePage = async (req, res, next) => {
    try {
        const loggedInUser = getLoggedInUser(req);

        const [carouselArtworks] = await db.query(
            `SELECT ArtworkID, Title, Description, ImageURL 
             FROM Artworks 
             WHERE status = 'approved' AND ImageURL IS NOT NULL AND ImageURL != '' 
             ORDER BY CreatedAt DESC LIMIT 3`
        );
        
        const [featuredArtistsDb] = await db.query(
            `SELECT ArtistID, Name, Biography 
             FROM Artists 
             ORDER BY RAND() LIMIT 6`
        ); 
        
        const artistsForCarousel = [];
        if (featuredArtistsDb && featuredArtistsDb.length > 0) {
            for (const artist of featuredArtistsDb) {
                const [artworksSample] = await db.query(
                    "SELECT ArtworkID, Title, ImageURL FROM Artworks WHERE ArtistID = ? AND status = 'approved' LIMIT 4", 
                    [artist.ArtistID]
                );
                artistsForCarousel.push({
                    ...artist,
                    mainImage: artworksSample.length > 0 ? artworksSample[0].ImageURL : '/img/placeholder-artist.png',
                    artworksSample: artworksSample
                });
            }
        }

        const [generalArtworks] = await db.query(
            `SELECT aw.ArtworkID, aw.Title, aw.ImageURL, ar.Name as ArtistName 
             FROM Artworks aw
             LEFT JOIN Artists ar ON aw.ArtistID = ar.ArtistID 
             WHERE aw.status = 'approved' AND aw.ImageURL IS NOT NULL AND aw.ImageURL != '' 
             ORDER BY aw.CreatedAt DESC LIMIT 3, 6`
        );
        
       res.render('index', {
            pageTitle: 'Art Gallery',
            user: loggedInUser,
            carouselArtworks: carouselArtworks,
            featuredArtists: artistsForCarousel,
            gridArtworks: generalArtworks, 
            currentPath: '/'
        });
    } catch (error) {
        console.error('Erro ao renderizar página inicial da galeria:', error);
        next(error);
    }
};

exports.renderLoginPage = (req, res, next) => {
    const loggedInUser = getLoggedInUser(req);
    if (loggedInUser) {
        return res.redirect(loggedInUser.isAdmin ? '/admin/permissions' : '/');
    }
    try {
        res.render('login', { 
            pageTitle: 'Login - Art Gallery',
            error: req.query.error || null,
            message: req.query.message || null,
            currentPath: '/login',
            user: null
        });
    } catch (error) {
        console.error('Erro ao renderizar página de login:', error);
        next(error);
    }
};

exports.renderRegisterPage = (req, res, next) => {
    if (getLoggedInUser(req)) {
        return res.redirect('/'); 
    }
    try {
        res.render('register', { 
            pageTitle: 'Criar Conta - Art Gallery',
            error: null, 
            currentPath: '/register',
            user: null
        });
    } catch (error) {
        console.error('Erro ao renderizar página de registro:', error);
        next(error);
    }
};

exports.renderRequestPasswordResetPage = (req, res, next) => {
    if (getLoggedInUser(req)) {
        return res.redirect('/'); 
    }
    try {
        res.render('request-reset', {
            pageTitle: 'Redefinir Senha - Art Gallery',
            message: req.query.message || null,
            error: req.query.error || null,
            currentPath: '/request-password-reset',
            user: null
        });
    } catch (error) {
        console.error('Erro ao renderizar página de solicitação de redefinição de senha:', error);
        next(error);
    }
};

exports.renderEnterResetTokenPage = (req, res, next) => {
    if (getLoggedInUser(req)) {
        return res.redirect('/'); 
    }
    try {
        res.render('enter-reset-token', {
            pageTitle: 'Inserir Código de Redefinição - Art Gallery',
            error: req.query.error || null,
            message: req.query.message || null,
            currentPath: '/enter-reset-token',
            user: null
        });
    } catch (error) {
        console.error('Erro ao renderizar página para inserir código de redefinição:', error);
        next(error);
    }
};

exports.renderSetNewPasswordPage = (req, res, next) => {
    const resetToken = req.query.token;
    if (!resetToken) {
        return res.redirect('/request-password-reset?error=Token de redefinição ausente ou inválido na URL.');
    }
    if (getLoggedInUser(req)) {
        return res.redirect('/');
    }
    try {
        res.render('set-new-password', {
            pageTitle: 'Definir Nova Senha - Art Gallery',
            token: resetToken,
            error: req.query.error || null,
            message: req.query.message || null,
            currentPath: '/set-new-password-page',
            user: null
        });
    } catch (error) {
        console.error('Erro ao renderizar página para definir nova senha:', error);
        next(error);
    }
};

exports.renderPermissionsPage = async (req, res, next) => {
    try {
        const [users] = await db.query('SELECT UserID, Name, Email, IsAdmin FROM Users ORDER BY Name ASC');
        const adminCount = users.filter(u => u.IsAdmin).length;
        res.render('admin/permissions', {
            pageTitle: 'Gerenciar Permissões',
            users: users,
            adminUser: req.user,
            adminCount: adminCount,
            currentPath: '/admin/permissions',
            user: req.user
        });
    } catch (error) {
        console.error('Erro ao buscar usuários para a página de permissões:', error);
        next(error);
    }
};

exports.renderNewArtworkForm = async (req, res, next) => {
    try {
        const [artists] = await db.query('SELECT ArtistID, Name FROM Artists ORDER BY Name ASC');
        res.render('artworks/new-artwork-form', {
            pageTitle: 'Cadastrar Nova Obra de Arte',
            artists: artists,
            user: req.user,
            currentPath: '/artworks/new'
        });
    } catch (error) {
        console.error('Erro ao buscar artistas para o formulário de nova obra:', error);
        next(error);
    }
};

exports.renderNewArtistForm = async (req, res, next) => {
    try {
        res.render('admin/artist-form', {
            pageTitle: 'Cadastrar Novo Artista',
            user: req.user,
            currentPath: '/admin/artists/new'
        });
    } catch (error) {
        console.error('Erro ao renderizar formulário de novo artista:', error);
        next(error);
    }
};

exports.renderArtworkValidationPage = async (req, res, next) => {
    try {
        const query = `
            SELECT aw.ArtworkID, aw.Title, aw.Description, aw.CreationYear, 
                   aw.Medium, aw.Dimensions, aw.ImageURL, aw.status,
                   ar.Name AS ArtistName 
            FROM Artworks aw
            LEFT JOIN Artists ar ON aw.ArtistID = ar.ArtistID
            WHERE aw.status = 'pending_review' 
            ORDER BY aw.CreatedAt DESC;
        `;
        const [pendingArtworks] = await db.query(query);
        res.render('admin/artwork-validation', {
            pageTitle: 'Validação de Obras de Arte',
            artworks: pendingArtworks,
            adminUser: req.user, 
            currentPath: '/admin/artworks/validate',
            user: req.user 
        });
    } catch (error) {
        console.error('Erro ao buscar obras para validação:', error);
        next(error);
    }
};

exports.renderDashboardPage = async (req, res, next) => {
    try {
        const loggedInUser = getLoggedInUser(req);

        const [userCountResult] = await db.query("SELECT COUNT(*) as count FROM Users");
        const [artistCountResult] = await db.query("SELECT COUNT(*) as count FROM Artists");
        const [artworkCountResult] = await db.query("SELECT COUNT(*) as count FROM Artworks WHERE status = 'approved'");
        const [pendingArtworkCountResult] = await db.query("SELECT COUNT(*) as count FROM Artworks WHERE status = 'pending_review'");

        const stats = {
            totalUsers: userCountResult[0].count,
            totalArtists: artistCountResult[0].count,
            totalArtworks: artworkCountResult[0].count,
            pendingArtworks: pendingArtworkCountResult[0].count
        };

        res.render('admin/dashboard', {
            pageTitle: 'Dashboard - Art Gallery',
            user: loggedInUser,
            stats: stats,
            currentPath: '/dashboard'
        });
    } catch (error) {
        console.error('Erro ao renderizar dashboard:', error);
        next(error);
    }
};

exports.renderArtistDetailPage = async (req, res, next) => {
    try {
        const loggedInUser = getLoggedInUser(req);
        const artistId = req.params.artistId;

        const [artistRows] = await db.query('SELECT * FROM Artists WHERE ArtistID = ?', [artistId]);
        if (artistRows.length === 0) {
            const error = new Error('Artista não encontrado.');
            error.status = 404; 
            return next(error); 
        }
        const artist = artistRows[0];

        const [artworksByArtist] = await db.query(
            "SELECT ArtworkID, Title, ImageURL, Description FROM Artworks WHERE ArtistID = ? AND status = 'approved' ORDER BY CreationYear DESC",
            [artistId]
        );

        artist.mainImage = artworksByArtist.length > 0 ? artworksByArtist[0].ImageURL : '/img/placeholder-artist.png';

        res.render('artist-detail', {
            pageTitle: `Detalhes de ${artist.Name}`,
            user: loggedInUser,
            artist: artist,
            artworks: artworksByArtist, 
            currentPath: `/artists/${artistId}/details`
        });

    } catch (error) {
        console.error(`Erro ao renderizar detalhes do artista ${req.params.artistId}:`, error);
        next(error);
    }
};

exports.renderFavoritesPage = async (req, res, next) => {
    try {
        const loggedInUser = getLoggedInUser(req); 
        if (!loggedInUser) {
            return res.redirect('/login?message=Você precisa estar logado para ver seus favoritos.');
        }

        const [featuredArtistsDb] = await db.query(
            `SELECT ArtistID, Name, Biography FROM Artists ORDER BY RAND() LIMIT 6`
        ); 
        const artistsForCarousel = [];
        if (featuredArtistsDb && featuredArtistsDb.length > 0) {
            for (const artist of featuredArtistsDb) {
                const [artworksSample] = await db.query(
                    "SELECT ArtworkID, Title, ImageURL FROM Artworks WHERE ArtistID = ? AND status = 'approved' LIMIT 4", 
                    [artist.ArtistID]
                );
                artistsForCarousel.push({
                    ...artist,
                    mainImage: artworksSample.length > 0 ? artworksSample[0].ImageURL : '/img/placeholder-artist.png',
                    artworksSample: artworksSample
                });
            }
        }

        const favoriteArtworksQuery = `
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
        const [favoriteArtworks] = await db.query(favoriteArtworksQuery, [loggedInUser.userId]);

        res.render('favorites', { 
            pageTitle: 'Meus Favoritos - Art Gallery',
            user: loggedInUser,
            featuredArtists: artistsForCarousel, 
            artworks: favoriteArtworks,      
            currentPath: '/favorites'
        });
    } catch (error) {
        console.error('Erro ao renderizar página de favoritos:', error);
        next(error);
    }
};

// Adicionando a função que faltava para a tela de gerenciamento (genérica)
exports.renderManagementPage = async (req, res, next) => {
    try {
        const loggedInUser = getLoggedInUser(req);

        
        const queryArtworks = `
            SELECT 
                aw.ArtworkID, aw.Title, aw.CreationYear, aw.status,
                ar.Name AS ArtistName 
            FROM Artworks aw
            LEFT JOIN Artists ar ON aw.ArtistID = ar.ArtistID
            ORDER BY aw.CreatedAt DESC; 
        `;
        const [initialArtworks] = await db.query(queryArtworks);

        res.render('admin/management', {
            pageTitle: 'Gerenciamento - Art Gallery',
            user: loggedInUser,
            initialDataType: 'artworks',
            initialData: initialArtworks,
            currentPath: '/admin/management'
        });
    } catch (error) {
        console.error('Erro ao renderizar página de gerenciamento:', error);
        next(error);
    }
};

exports.renderArtworkDetailPagePublic = async (req, res, next) => {
    try {
        const loggedInUser = getLoggedInUser(req);
        const artworkId = req.params.artworkId;

        // 1. Buscar a obra de arte principal e seu artista
        const mainArtworkQuery = `
            SELECT aw.*, ar.ArtistID as ArtistObjID, ar.Name AS ArtistName, ar.Biography AS ArtistBiography
            FROM Artworks aw
            LEFT JOIN Artists ar ON aw.ArtistID = ar.ArtistID
            WHERE aw.ArtworkID = ? AND aw.status = 'approved';
        `;
        const [artworkRows] = await db.query(mainArtworkQuery, [artworkId]);

        if (artworkRows.length === 0) {
            const error = new Error('Obra de arte não encontrada ou não aprovada.');
            error.status = 404;
            return next(error);
        }
        const artwork = artworkRows[0];

        // Construir objeto artista a partir dos dados da obra
        const artistOfArtwork = artwork.ArtistObjID ? {
            ArtistID: artwork.ArtistObjID,
            Name: artwork.ArtistName,
            Biography: artwork.ArtistBiography, // Pode ser a biografia completa aqui

            mainImage: '/img/placeholder-artist.png' 
        } : null;

        
        if (artistOfArtwork) {
            const [artistArtworks] = await db.query(
                "SELECT ImageURL FROM Artworks WHERE ArtistID = ? AND status = 'approved' AND ImageURL IS NOT NULL AND ImageURL != '' LIMIT 1",
                [artistOfArtwork.ArtistID]
            );
            if (artistArtworks.length > 0) {
                artistOfArtwork.mainImage = artistArtworks[0].ImageURL;
            }
        }
        
        
        let similarArtworks = [];
        if (artwork.ArtistID) { // Se a obra tem um artista, pega outras dele
            const [similarsFromArtist] = await db.query(
                `SELECT ArtworkID, Title, ImageURL, ArtistID FROM Artworks 
                 WHERE ArtistID = ? AND ArtworkID != ? AND status = 'approved' 
                 ORDER BY RAND() LIMIT 2`, // Pega 2 obras similares do mesmo artista
                [artwork.ArtistID, artworkId]
            );
            similarArtworks = similarsFromArtist;
        }
        if (similarArtworks.length < 2) { // Se não achou 2, completa com outras aleatórias
            const needed = 2 - similarArtworks.length;
            const [randomSimilars] = await db.query(
                `SELECT ArtworkID, Title, ImageURL, ArtistID FROM Artworks 
                 WHERE ArtworkID != ? AND status = 'approved' 
                 ${artwork.ArtistID ? 'AND ArtistID != ' + db.escape(artwork.ArtistID) : ''}
                 ORDER BY RAND() LIMIT ?`,
                [artworkId, needed]
            );
            similarArtworks = [...similarArtworks, ...randomSimilars];
        }


       
        const comments = [
            // { UserName: 'Lana Miranda', Text: 'Ficou lindo💕', AvatarURL: '/img/usuario.jpg' } // Exemplo
        ];

        
        let isFavorited = false;
        if (loggedInUser) {
            // const [favs] = await db.query("SELECT FavoriteID FROM UserFavorites WHERE UserID = ? AND ArtworkID = ?", [loggedInUser.userId, artwork.ArtworkID]);
            // isFavorited = favs.length > 0;
        }


        res.render('artwork-detail', { // Renderiza views/artwork-detail.ejs
            pageTitle: artwork.Title,
            user: loggedInUser,
            artwork: artwork,
            artistOfArtwork: artistOfArtwork,
            similarArtworks: similarArtworks,
            comments: comments, // Passa os comentários (vazio por enquanto)
            isFavorited: isFavorited, // Passa o status de favorito
            currentPath: `/artworks/${artworkId}/details-public`
        });

    } catch (error) {
        console.error(`Erro ao renderizar detalhes da obra ${req.params.artworkId}:`, error);
        next(error);
    }
};

exports.renderUserProfilePage = async (req, res, next) => {
    try {
        const loggedInUser = getLoggedInUser(req); // req.user já foi populado por 'protect'
        if (!loggedInUser) {
            return res.redirect('/login?message=Você precisa estar logado para ver seu perfil.');
        }

        
        const [users] = await db.query('SELECT UserID, Name, Email FROM Users WHERE UserID = ?', [loggedInUser.userId]);
        if (users.length === 0) {
            // Isso não deveria acontecer se o token é válido
            return res.redirect('/login?error=Usuário não encontrado');
        }
        const userProfileData = users[0];


        res.render('profile', { // Renderiza views/profile.ejs
            pageTitle: 'Meu Perfil - Art Gallery',
            user: loggedInUser, // Para o menu e saudação
            profileData: userProfileData, // Para preencher o formulário
            currentPath: '/profile'
        });
    } catch (error) {
        console.error('Erro ao renderizar página de perfil:', error);
        next(error);
    }
};

exports.renderArtistsListPage = async (req, res, next) => {
    try {
        const loggedInUser = getLoggedInUser(req); // Nossa função auxiliar que obtém o usuário do cookie

        // 1. Buscar todos os artistas
        const [artists] = await db.query('SELECT ArtistID, Name, Biography FROM Artists ORDER BY Name ASC');
        
        // 2. Para cada artista, buscar uma imagem de amostra (a primeira obra aprovada, por exemplo)
        for (const artist of artists) {
            const [artworksSample] = await db.query(
                "SELECT ImageURL FROM Artworks WHERE ArtistID = ? AND status = 'approved' AND ImageURL IS NOT NULL AND ImageURL != '' LIMIT 1",
                [artist.ArtistID]
            );
            artist.mainImage = artworksSample.length > 0 ? artworksSample[0].ImageURL : '/img/placeholder-artist.png'; // Use a mesma imagem de placeholder
        }

        res.render('artists-list', { // Renderiza o novo arquivo views/artists-list.ejs
            pageTitle: 'Nossos Artistas - Art Gallery',
            user: loggedInUser,
            artists: artists, // Passa a lista completa de artistas para o template
            currentPath: '/artists'
        });

    } catch (error) {
        console.error('Erro ao renderizar a lista de artistas:', error);
        next(error);
    }
};

exports.renderDashboardPage = async (req, res, next) => {
    try {
        const loggedInUser = getLoggedInUser(req);

        // --- 1. Dados para os Cards ---
        const [userCountResult] = await db.query("SELECT COUNT(*) as count FROM Users");
        const [artistCountResult] = await db.query("SELECT COUNT(*) as count FROM Artists");
        const [artworkCountResult] = await db.query("SELECT COUNT(*) as count FROM Artworks WHERE status = 'approved'");
        const [pendingArtworkCountResult] = await db.query("SELECT COUNT(*) as count FROM Artworks WHERE status = 'pending_review'");
        const [newUsersThisPeriodResult] = await db.query("SELECT COUNT(*) as count FROM Users WHERE CreatedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
        const [newUsersLastPeriodResult] = await db.query("SELECT COUNT(*) as count FROM Users WHERE CreatedAt >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND CreatedAt < DATE_SUB(NOW(), INTERVAL 30 DAY)");
        
        const newUsersThisPeriod = newUsersThisPeriodResult[0].count;
        const newUsersLastPeriod = newUsersLastPeriodResult[0].count;
        let newUsersTrend = 0;
        if (newUsersLastPeriod > 0) newUsersTrend = ((newUsersThisPeriod - newUsersLastPeriod) / newUsersLastPeriod) * 100;
        else if (newUsersThisPeriod > 0) newUsersTrend = 100;

        const stats = {
            totalUsers: userCountResult[0].count,
            totalArtists: artistCountResult[0].count,
            totalArtworks: artworkCountResult[0].count,
            pendingArtworks: pendingArtworkCountResult[0].count,
            newUsersCount: newUsersThisPeriod,
            newUsersTrend: newUsersTrend.toFixed(2)
        };

        // --- 2. Dados para o Gráfico de Linha ---
        const [usersLast7Days] = await db.query(`SELECT DATE(CreatedAt) as date, COUNT(UserID) as count FROM Users WHERE CreatedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY DATE(CreatedAt) ORDER BY date ASC`);
        const lineChartLabels = [];
        const lineChartData = [];
        const last7Days = [...Array(7).keys()].map(i => new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)).reverse();
        last7Days.forEach(day => {
            lineChartLabels.push(new Date(day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
            const found = usersLast7Days.find(row => new Date(row.date).toISOString().slice(0, 10) === day);
            lineChartData.push(found ? found.count : 0);
        });
        const lineChart = { labels: lineChartLabels, data: lineChartData };

        // --- 3. Dados para o Gráfico de Rosca ---
        const [artworkStatusResult] = await db.query("SELECT status, COUNT(*) as count FROM Artworks GROUP BY status");
        const artworkStatusChart = {
            labels: artworkStatusResult.map(row => row.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())),
            data: artworkStatusResult.map(row => row.count)
        };

        // --- Renderiza a página passando TODOS os dados ---
        res.render('admin/dashboard', {
            pageTitle: 'Dashboard - Art Gallery',
            user: loggedInUser,
            stats,
            lineChart,
            artworkStatusChart,
            currentPath: '/dashboard'
        });
    } catch (error) {
        console.error('Erro ao renderizar dashboard:', error);
        next(error);
    }
};