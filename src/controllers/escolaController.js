const pool = require('../config/db');

// lat/lng 
const COLS = `id, nome, rede, etapa, descricao,
  ST_Y(geom::geometry) AS lat, ST_X(geom::geometry) AS lng`;

const num = (v) => (v === undefined || v === '' ? NaN : Number(v));

// Captura erros de funções async e responde 500
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => {
  console.error(e);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

// READ: somente escolas dentro da área visível (bounding box)
exports.listarPorArea = wrap(async (req, res) => {
  const [minLng, minLat, maxLng, maxLat] =
    ['minLng', 'minLat', 'maxLng', 'maxLat'].map((k) => num(req.query[k]));
  if ([minLng, minLat, maxLng, maxLat].some(Number.isNaN))
    return res.status(400).json({ erro: 'Informe minLng, minLat, maxLng e maxLat' });
  const { rows } = await pool.query(
    `SELECT ${COLS} FROM escolas
     WHERE ST_Intersects(geom, ST_MakeEnvelope($1,$2,$3,$4,4326)::geography)
     LIMIT 500`, [minLng, minLat, maxLng, maxLat]);
  res.json(rows);
});

// READ: escolas a uma distância (km) de um ponto
exports.listarProximas = wrap(async (req, res) => {
  const lat = num(req.query.lat), lng = num(req.query.lng), raio = num(req.query.raio);
  if ([lat, lng, raio].some(Number.isNaN) || raio <= 0)
    return res.status(400).json({ erro: 'Informe lat, lng e raio (km)' });
  const { rows } = await pool.query(
    `SELECT ${COLS},
       ST_Distance(geom, p.pt) AS distancia_m
     FROM escolas, (SELECT ST_SetSRID(ST_MakePoint($1,$2),4326)::geography AS pt) p
     WHERE ST_DWithin(geom, p.pt, $3)
     ORDER BY distancia_m`, [lng, lat, raio * 1000]);
  res.json(rows);
});

// CREATE
exports.criar = wrap(async (req, res) => {
  const { nome, rede, etapa, descricao } = req.body;
  const lat = num(req.body.lat), lng = num(req.body.lng);
  if (!nome || !rede || !etapa || Number.isNaN(lat) || Number.isNaN(lng))
    return res.status(400).json({ erro: 'nome, rede, etapa, lat e lng são obrigatórios' });
  const { rows } = await pool.query(
    `INSERT INTO escolas (nome, rede, etapa, descricao, geom)
     VALUES ($1,$2,$3,$4, ST_SetSRID(ST_MakePoint($5,$6),4326)::geography)
     RETURNING ${COLS}`, [nome, rede, etapa, descricao || null, lng, lat]);
  res.status(201).json(rows[0]);
});

// UPDATE
exports.atualizar = wrap(async (req, res) => {
  const { nome, rede, etapa, descricao } = req.body;
  const lat = num(req.body.lat), lng = num(req.body.lng);
  if (!nome || !rede || !etapa || Number.isNaN(lat) || Number.isNaN(lng))
    return res.status(400).json({ erro: 'nome, rede, etapa, lat e lng são obrigatórios' });
  const { rows } = await pool.query(
    `UPDATE escolas SET nome=$1, rede=$2, etapa=$3, descricao=$4,
       geom = ST_SetSRID(ST_MakePoint($5,$6),4326)::geography
     WHERE id=$7 RETURNING ${COLS}`, [nome, rede, etapa, descricao || null, lng, lat, req.params.id]);
  if (!rows.length) return res.status(404).json({ erro: 'Escola não encontrada' });
  res.json(rows[0]);
});

// DELETE
exports.excluir = wrap(async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM escolas WHERE id=$1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ erro: 'Escola não encontrada' });
  res.status(204).end();
});
