-- Rode no SQL Editor do Supabase
-- (se você já criou a tabela antiga: drop table if exists ecopontos;)
create extension if not exists postgis;

create table if not exists escolas (
  id         serial primary key,
  nome       text not null,
  rede       text not null,   -- Municipal, Estadual ou Federal
  etapa      text not null,   -- Infantil, Fundamental, Médio...
  descricao  text,            -- endereço, telefone, turnos
  geom       geography(Point, 4326) not null,   -- objeto espacial PostGIS
  criado_em  timestamptz default now()
);

-- Índice espacial: deixa as buscas por área e distância rápidas
create index if not exists escolas_geom_idx on escolas using gist (geom);
