const express = require('express');
const c = require('../controllers/escolaController');

const router = express.Router();

router.get('/', c.listarPorArea);          // GET    /api/escolas?minLng&minLat&maxLng&maxLat
router.get('/proximas', c.listarProximas); // GET    /api/escolas/proximas?lat&lng&raio
router.post('/', c.criar);                 // POST   /api/escolas
router.put('/:id', c.atualizar);           // PUT    /api/escolas/:id
router.delete('/:id', c.excluir);          // DELETE /api/escolas/:id

module.exports = router;
