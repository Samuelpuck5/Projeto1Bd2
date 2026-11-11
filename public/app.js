const $ = (id) => document.getElementById(id);
const esc = (s = '') => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- Mapa ----------
const map = L.map('map').setView([-6.7597, -38.2281], 13); //começa de Sousa-PB
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19, attribution: '&copy; OpenStreetMap'
}).addTo(map);

const camada = L.layerGroup().addTo(map);   // pontos do banco
const raioCirculo = L.layerGroup().addTo(map);
let usuario = null, rascunho = null, modo = 'area';

function aviso(msg) {
  const el = $('aviso'); el.textContent = msg; el.classList.add('on');
  clearTimeout(aviso.t); aviso.t = setTimeout(() => el.classList.remove('on'), 3500);
}

async function api(url, opts = {}) {
  const r = await fetch('/api' + url, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (r.status === 204) return null;
  const dados = await r.json();
  if (!r.ok) throw new Error(dados.erro || 'Erro na requisição');
  return dados;
}

// ---------- Geolocalização ----------
navigator.geolocation?.getCurrentPosition(
  (pos) => {
    usuario = [pos.coords.latitude, pos.coords.longitude];
    L.circleMarker(usuario, { radius: 8, color: '#fff', weight: 2, fillColor: '#1a73e8', fillOpacity: 1 })
      .addTo(map).bindTooltip('Você está aqui');
    map.setView(usuario, 15);
  },
  () => { aviso('Não foi possível obter sua localização. Permita o acesso no navegador.'); carregarArea(); },
  { enableHighAccuracy: true, timeout: 10000 }
);

// ---------- área visível ----------
async function carregarArea() {
  if (modo !== 'area') return;
  const b = map.getBounds();
  const q = new URLSearchParams({ minLng: b.getWest(), minLat: b.getSouth(), maxLng: b.getEast(), maxLat: b.getNorth() });
  try { desenhar(await api('/escolas?' + q)); } catch (e) { aviso(e.message); }
}
let t;
map.on('moveend', () => { clearTimeout(t); t = setTimeout(carregarArea, 300); });

function desenhar(pontos) {
  camada.clearLayers();
  pontos.forEach((p) => {
    const m = L.marker([p.lat, p.lng]).addTo(camada);
    m.bindPopup(() => popup(p));
  });
}

function popup(p) {
  const el = document.createElement('div');
  el.innerHTML = `<strong>${esc(p.nome)}</strong><br>${esc(p.rede)} — ${esc(p.etapa)}<br>${esc(p.descricao || '')}
    <div class="popup-acoes"><button class="sec">Editar</button><button class="perigo">Excluir</button></div>`;
  const [ed, ex] = el.querySelectorAll('button');
  ed.onclick = () => editar(p);
  ex.onclick = async () => {
    if (!confirm(`Excluir "${p.nome}"?`)) return;
    await api('/escolas/' + p.id, { method: 'DELETE' });
    aviso('Escola excluída'); map.closePopup(); recarregar();
  };
  return el;
}

function recarregar() { modo === 'perto' ? buscarPerto() : carregarArea(); }

// ----------perto de mim ----------
async function buscarPerto() {
  const o = origem();
  if (!o) return aviso(origemFixa() ? 'Defina o ponto fixo no mapa primeiro.' : 'Aguardando sua localização. Permita o acesso no navegador.');
  const raio = parseFloat($('raio').value);
  if (!(raio > 0)) return aviso('Informe um raio maior que zero.');
  modo = 'perto';
  const pts = await api(`/escolas/proximas?lat=${o[0]}&lng=${o[1]}&raio=${raio}`);
  desenhar(pts);
  raioCirculo.clearLayers();
  const c = L.circle(o, { radius: raio * 1000, color: '#0d6b5c', weight: 1, fillOpacity: .06 }).addTo(raioCirculo);
  map.fitBounds(c.getBounds());
  $('btnVoltar').hidden = false;
  const ul = $('resultados'); ul.innerHTML = '';
  if (!pts.length) ul.innerHTML = '<li>Nenhuma escola neste raio. Aumente a distância.</li>';
  pts.forEach((p) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${esc(p.nome)}</strong><small>${esc(p.rede)}, ${esc(p.etapa)} — a ${(p.distancia_m / 1000).toFixed(2)} km</small>`;
    li.onclick = () => map.flyTo([p.lat, p.lng], 17);
    ul.appendChild(li);
  });
}
$('btnPerto').onclick = () => buscarPerto().catch((e) => aviso(e.message));
$('btnVoltar').onclick = () => {
  modo = 'area'; raioCirculo.clearLayers(); $('resultados').innerHTML = ''; $('btnVoltar').hidden = true; carregarArea();
};

// ---------- Cadastro: marcar posição ----------
function marcar(latlng) {
  if (rascunho) rascunho.setLatLng(latlng);
  else {
    rascunho = L.marker(latlng, { draggable: true, opacity: .8 }).addTo(map);
    rascunho.on('dragend', () => atualizarPosicao());
  }
  atualizarPosicao();
}
function atualizarPosicao() {
  const { lat, lng } = rascunho.getLatLng();
  $('posicao').textContent = `Posição marcada: ${lat.toFixed(5)}, ${lng.toFixed(5)} (arraste o marcador para ajustar)`;
}
map.on('click', (e) => (escolhendoRef ? definirRef(e.latlng) : marcar(e.latlng)));

// ---------- Nominatim ----------
$('busca').onsubmit = async (e) => {
  e.preventDefault();
  const q = $('endereco').value.trim(); if (!q) return;
  const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=br&viewbox=-38.40,-6.60,-38.05,-6.90&q=' + encodeURIComponent(q));
  const res = await r.json();
  const ul = $('geo'); ul.innerHTML = '';
  if (!res.length) ul.innerHTML = '<li>Nenhum resultado. Tente incluir a cidade.</li>';
  res.forEach((x) => {
    const li = document.createElement('li');
    li.textContent = x.display_name;
    li.onclick = () => { const ll = L.latLng(+x.lat, +x.lon); map.flyTo(ll, 17); escolhendoRef ? definirRef(ll) : marcar(ll); ul.innerHTML = ''; };
    ul.appendChild(li);
  });
};

// ---------- Salvar (create/update) ----------
$('form').onsubmit = async (e) => {
  e.preventDefault();
  if (!rascunho) return aviso('Marque a posição no mapa antes de salvar.');
  const { lat, lng } = rascunho.getLatLng();
  const corpo = JSON.stringify({ nome: $('nome').value, rede: $('rede').value, etapa: $('etapa').value, descricao: $('descricao').value, lat, lng });
  const id = $('id').value;
  try {
    await api(id ? '/escolas/' + id : '/escolas', { method: id ? 'PUT' : 'POST', body: corpo });
    aviso(id ? 'Escola atualizada' : 'Escola cadastrada');
    limparForm(); recarregar();
  } catch (err) { aviso(err.message); }
};

function editar(p) {
  $('id').value = p.id; $('nome').value = p.nome; $('rede').value = p.rede; $('etapa').value = p.etapa; $('descricao').value = p.descricao || '';
  $('tituloForm').textContent = 'Editar escola'; $('btnCancelar').hidden = false;
  marcar(L.latLng(p.lat, p.lng)); map.closePopup();
}
function limparForm() {
  $('form').reset(); $('id').value = ''; $('tituloForm').textContent = 'Cadastrar escola';
  $('btnCancelar').hidden = true; $('geo').innerHTML = '';
  $('posicao').textContent = 'Clique no mapa ou escolha um endereço para marcar a posição.';
  if (rascunho) { map.removeLayer(rascunho); rascunho = null; }
}
$('btnCancelar').onclick = limparForm;

// ---------- Ponto fixo de referência ----------
let refFixo = null, refMarker = null, escolhendoRef = false;
const origemFixa = () => document.querySelector('input[name=origem]:checked').value === 'fixo';
const origem = () => (origemFixa() ? refFixo : usuario);

function desenharRef() {
  if (refMarker) refMarker.setLatLng(refFixo);
  else {
    refMarker = L.marker(refFixo, { draggable: true, icon: L.divIcon({ className: 'ref-pin', iconSize: [18, 18] }) })
      .addTo(map).bindTooltip('Ponto fixo (arraste para ajustar)');
    refMarker.on('dragend', () => definirRef(refMarker.getLatLng()));
  }
}
function definirRef(ll) {
  refFixo = [ll.lat, ll.lng];
  try { localStorage.setItem('refFixo', JSON.stringify(refFixo)); } catch {}
  desenharRef();
  escolhendoRef = false; $('btnFixo').textContent = 'Definir ponto fixo no mapa';
  document.querySelector('input[name=origem][value=fixo]').checked = true;
  aviso('Ponto fixo definido. Agora clique em Buscar.');
}
$('btnFixo').onclick = () => {
  escolhendoRef = !escolhendoRef;
  $('btnFixo').textContent = escolhendoRef ? 'Cancelar (clique no mapa ou busque um endereço)' : 'Definir ponto fixo no mapa';
  if (escolhendoRef) aviso('Navegue até o local e clique no mapa.');
};
document.querySelectorAll('input[name=origem]').forEach((r) => (r.onchange = () => {
  if (origemFixa() && refFixo) map.flyTo(refFixo, 15);
  else if (!origemFixa() && usuario) map.flyTo(usuario, 15);
}));

// restaura o ponto fixo salvo neste navegador
try {
  const salvo = JSON.parse(localStorage.getItem('refFixo'));
  if (Array.isArray(salvo)) { refFixo = salvo; desenharRef(); document.querySelector('input[name=origem][value=fixo]').checked = true; }
} catch {}
