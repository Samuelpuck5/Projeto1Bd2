# Escolas públicas de Sousa-PB

CRUD de escolas públicas do município de Sousa (Paraíba) com **Node.js + Express**, **PostGIS (Supabase)** e **Leaflet**.

## Rodar localmente
1. `cp .env.example .env` e preencha `DATABASE_URL` (Supabase).
2. Rode `schema.sql` e depois `seed.sql` (escolas iniciais) no SQL Editor do Supabase.
3. `npm install && npm start` → http://localhost:3000

## Endpoints
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/pontos?minLng&minLat&maxLng&maxLat` | Pontos na área visível |
| GET | `/api/pontos/proximos?lat&lng&raio` | Pontos num raio (km) |
| POST | `/api/pontos` | Criar |
| PUT | `/api/pontos/:id` | Atualizar |
| DELETE | `/api/pontos/:id` | Excluir |

## Deploy (Render)
Web Service → Build: `npm install` → Start: `npm start` → variável `DATABASE_URL`.

## Equipe
- (nomes dos integrantes)
