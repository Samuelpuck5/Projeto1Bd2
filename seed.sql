-- Rode DEPOIS do schema.sql, no SQL Editor do Supabase.
-- Pode rodar mais de uma vez: escolas com o mesmo nome não são duplicadas.
-- Atenção: ST_MakePoint recebe (longitude, latitude), por isso a ordem abaixo.

insert into escolas (nome, rede, etapa, descricao, geom)
select v.nome, v.rede, v.etapa, v.descricao,
       ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)::geography
from (values
  ('Escola Normal Estadual José de Paiva Gadelha', 'Estadual', 'Ensino Médio',   'Rua Dep. José Paiva Gadelha, 127 - Gato Preto', -6.7640, -38.2211),
  ('EEEM Mestre Julio Sarmento',                   'Estadual', 'Ensino Médio',   'Rua Dep. José Paiva Gadelha, 125 - Gato Preto', -6.7640, -38.2211),
  ('E.E.E.F. de Demonstração de Sousa',            'Estadual', 'Várias etapas',  'Rua Dep. José Paiva Gadelha, 141 - Gato Preto', -6.7640, -38.2211),
  ('EEEFM Celso Mariz',                            'Estadual', 'Várias etapas',  'Rua Pres. Tancredo Neves, 566 - Jardim Sorrilândia III', -6.7781, -38.2312),
  ('EMEF Maria Aurita da Silva',                   'Municipal','Várias etapas',  'Rua Cônego José Viana, 35 - Estação', -6.7666, -38.2325),
  ('Escola Municipal Antônio Pereira da Silva',    'Municipal','Várias etapas',  'Mutirão', -6.7514, -38.2310),
  ('Escola Municipal Rômulo Pires',                'Municipal','Várias etapas',  'Rua Deocleciano Nunes Resende, 36-42 - Zú Silva', -6.7693, -38.2262),
  ('Escola Municipal Maria Marques de Sousa',      'Municipal','Várias etapas',  'Rua Maria Hermínia, 118-232 - Jardim Brasília', -6.7753, -38.2480),
  ('Escola Municipal Papa Paulo VI',               'Municipal','Várias etapas',  'Rua São Paulo - Jardim Sorrilândia', -6.7764, -38.2341),
  ('Escola Municipal Maria Estrela de Oliveira',   'Municipal','Várias etapas',  'PB-391', -6.7514, -38.2310)
) as v(nome, rede, etapa, descricao, lat, lng)
where not exists (select 1 from escolas e where e.nome = v.nome);
