# Escolas públicas de Sousa-PB

CRUD de escolas públicas do município de Sousa (Paraíba) com **Node.js + Express**, **PostGIS (Supabase)** e **Leaflet**.

## Rodar localmente
1. `cp .env.example .env` e preencha `DATABASE_URL` (Supabase).
2. Rode `schema.sql` e depois `seed.sql` (escolas iniciais) no SQL Editor do Supabase.
3. `npm install && npm start` → http://localhost:3000

## Estrutura
```
public/   frontend (HTML, CSS, JS + Leaflet)
src/
├── config/db.js                      conexão com o Supabase
├── controllers/escolaController.js   lógica de salvar/buscar no banco
├── routes/escolaRoutes.js            define as URLs da API
└── server.js                         liga o servidor
schema.sql / seed.sql                 banco de dados
```

## Endpoints
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/escolas?minLng&minLat&maxLng&maxLat` | Escolas na área visível |
| GET | `/api/escolas/proximas?lat&lng&raio` | Escolas num raio (km) |
| POST | `/api/escolas` | Criar |
| PUT | `/api/escolas/:id` | Atualizar |
| DELETE | `/api/escolas/:id` | Excluir |

## Deploy (Render)
Web Service → Build: `npm install` → Start: `npm start` → variável `DATABASE_URL`.

## Equipe
- (nomes dos integrantes)
