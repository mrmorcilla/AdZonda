
const adsContainer = document.getElementById('ads-container');
const loadAdsBtn = document.getElementById('load-ads-btn');

// Función para generar un anuncio falso (para demo)
function crearAnuncio(id) {
  const adDiv = document.createElement('div');
  adDiv.className = 'ad';
  adDiv.textContent = `Anuncio #${id}`;
  return adDiv;
}

// Carga inicial de 3 anuncios
let adCount = 0;
function cargarAnuncios(cantidad = 3) {
  for (let i = 0; i < cantidad; i++) {
    adCount++;
    adsContainer.appendChild(crearAnuncio(adCount));
  }
}

// Evento botón para cargar más anuncios
loadAdsBtn.addEventListener('click', () => {
  cargarAnuncios(3);
  // Opcional: desplazarse al último anuncio cargado
  adsContainer.lastChild.scrollIntoView({ behavior: 'smooth' });
});

// Carga inicial
cargarAnuncios();
