// art-gallery-backend-novo/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const artistRoutes = require('./artistRoutes');
const artworkRoutes = require('./artworkRoutes'); 

router.get('/', (req, res) => {
    res.json({ message: 'Ponto de entrada da API funcionando!' });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/artists', artistRoutes);
router.use('/artworks', artworkRoutes); 

module.exports = router;