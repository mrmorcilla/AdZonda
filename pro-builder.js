// pro-builder.js mejorado con carruseles funcionales, --hide y --show
(async () => {
  const response = await fetch('void.adzonda');
  const text = await response.text();
  const lines = text.split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('~')); // Filtra comentarios que empiecen con ~

  const body = document.body;
  body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
  body.style.margin = '20px auto';
  body.style.maxWidth = '900px';
  body.style.lineHeight = '1.6';
  body.style.color = '#333';
  body.style.padding = '0 15px';

  const sections = {};
  const aliases = {};
  const imageRefs = {};
  const pendingEvents = [];
  const pendingStyles = [];

  let inEvents = false;

  function createSectionIfNeeded(name) {
    if (!sections[name]) {
      const div = document.createElement('section');
      div.id = name.toLowerCase();
      div.classList.add('adz-section');
      body.appendChild(div);
      sections[name] = div;
    }
    return sections[name];
  }

  function applyStyle(el, prop, val) {
    const value = parseColor(val);
    switch (prop.toUpperCase()) {
      case 'COLOR': el.style.color = value; break;
      case 'ALIGN': el.style.textAlign = val; break;
      case 'SIZE': el.style.fontSize = val; break;
      case 'BACKGROUND':
        if (value === 'rainbow') {
          el.style.backgroundImage = 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)';
          el.style.webkitBackgroundClip = 'text';
          el.style.webkitTextFillColor = 'transparent';
        } else el.style.backgroundColor = value;
        break;
      case 'BORDER': el.style.border = val; break;
    }
  }

  function parseColor(name) {
    const colors = {
      rojo: '#e74c3c', azul: '#3498db', verde: '#27ae60', amarillo: '#f1c40f',
      negro: '#2c3e50', blanco: '#ecf0f1', naranja: '#e67e22', rosa: '#fd79a8',
      gris: '#7f8c8d', rainbow: 'rainbow'
    };
    return colors[name.toLowerCase()] || name;
  }

  function applyPresetStyle(el, styleName) {
    const styles = {
      // Botón estilos
      'boton.estilo1': { background: '#3498db', hover: '#2980b9', color: '#fff' },
      'boton.estilo2': { background: '#e74c3c', hover: '#c0392b', color: '#fff' },
      'boton.estilo3': { background: '#2ecc71', hover: '#27ae60', color: '#fff' },
      'boton.estilo4': { background: '#9b59b6', hover: '#8e44ad', color: '#fff' },
      'boton.estilo5': { background: '#f39c12', hover: '#e67e22', color: '#fff' },

      // Carrusel estilos
      'carrusel.estilo1': { border: '3px solid #3498db', borderRadius: '12px', padding: '15px', backgroundColor: '#f8f9fa' },
      'carrusel.estilo2': { border: '2px dashed #2ecc71', backgroundColor: '#ecf0f1', borderRadius: '10px', padding: '15px' },
      'carrusel.estilo3': { backgroundColor: '#fefefe', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', padding: '20px', borderRadius: '15px' },
      'carrusel.estilo4': { border: '2px solid #f1c40f', borderRadius: '10px', backgroundColor: '#fcf3cf', padding: '15px' },
      'carrusel.estilo5': { border: '1px solid #ddd', backgroundColor: '#fff', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }
    };
    
    const s = styles[styleName.toLowerCase()];
    if (!s) return;
    
    Object.entries(s).forEach(([k, v]) => {
      if (k !== 'hover') {
        el.style[k] = v;
      }
    });
    
    // Para botones, aplicar efecto hover
    if (s.hover && el.tagName === 'BUTTON') {
      const original = el.style.background;
      el.addEventListener('mouseenter', () => el.style.background = s.hover);
      el.addEventListener('mouseleave', () => el.style.background = original);
    }
  }

  function handleEvent(alias, action, value) {
    const el = aliases[alias];
    if (!el) return console.warn(`No se encontró el alias "${alias}"`);
    
    const act = action.toUpperCase().replace(/\s|_|-/g, '');
    
    if (act === 'REDIRECT') {
      el.style.cursor = 'pointer';
      el.onclick = () => window.location.href = value;
    } else if (act === 'HIDEONCLICK') {
      el.style.cursor = 'pointer';
      el.onclick = () => el.style.display = 'none';
    } else if (act === 'SHOW') {
      // Función para mostrar elementos ocultos
      el.style.cursor = 'pointer';
      el.onclick = () => {
        const targetAlias = value.replace(/"/g, '').trim();
        const targetEl = aliases[targetAlias];
        if (targetEl) {
          targetEl.style.display = targetEl.tagName === 'IMG' ? 'block' : 
                                   targetEl.tagName === 'BUTTON' ? 'inline-block' : 
                                   targetEl.classList.contains('adz-carousel') ? 'block' : 'block';
          targetEl.style.opacity = '0';
          targetEl.style.animation = 'fadeInShow 0.5s ease forwards';
        }
      };
    } else if (act === 'CLICK') {
      const parts = value.trim().split(/\s+/);
      const cmd = parts[0].toUpperCase();
      const rest = parts.slice(1).join(' ');
      el.style.cursor = 'pointer';
      
      if (cmd === 'ALERT') {
        el.onclick = () => alert(rest);
      } else if (cmd === 'REDIRECT') {
        el.onclick = () => window.location.href = rest;
      } else if (cmd === 'SHOW') {
        // CLICK SHOW "alias"
        el.onclick = () => {
          const targetAlias = rest.replace(/"/g, '').trim();
          const targetEl = aliases[targetAlias];
          if (targetEl) {
            targetEl.style.display = targetEl.tagName === 'IMG' ? 'block' : 
                                     targetEl.tagName === 'BUTTON' ? 'inline-block' : 
                                     targetEl.classList.contains('adz-carousel') ? 'block' : 'block';
            targetEl.style.opacity = '0';
            targetEl.style.animation = 'fadeInShow 0.5s ease forwards';
          }
        };
      }
    }
  }

  function createCarousel(aliases_list, alias) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('adz-carousel');
    wrapper.style.position = 'relative';
    wrapper.style.width = '100%';
    wrapper.style.maxWidth = '800px';
    wrapper.style.margin = '20px auto';
    wrapper.style.textAlign = 'center';
    wrapper.dataset.alias = alias;

    // Contenedor principal del carrusel
    const carouselContainer = document.createElement('div');
    carouselContainer.style.position = 'relative';
    carouselContainer.style.width = '100%';
    carouselContainer.style.height = '400px';
    carouselContainer.style.overflow = 'hidden';
    carouselContainer.style.borderRadius = '12px';
    carouselContainer.style.backgroundColor = '#f8f9fa';

    // Contenedor deslizante
    const slider = document.createElement('div');
    slider.style.display = 'flex';
    slider.style.width = `${aliases_list.length * 100}%`;
    slider.style.height = '100%';
    slider.style.transition = 'transform 0.5s ease-in-out';

    let current = 0;
    const totalImages = aliases_list.length;

    // Crear imágenes del carrusel
    aliases_list.forEach((imgAlias, index) => {
      const originalImg = imageRefs[imgAlias];
      if (!originalImg) {
        console.warn(`Imagen con alias "${imgAlias}" no encontrada`);
        return;
      }

      const imageWrapper = document.createElement('div');
      imageWrapper.style.width = `${100 / totalImages}%`;
      imageWrapper.style.height = '100%';
      imageWrapper.style.flexShrink = '0';

      const img = document.createElement('img');
      img.src = originalImg.src;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.display = 'block';
      
      imageWrapper.appendChild(img);
      slider.appendChild(imageWrapper);
    });

    // Botones de navegación
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '❮';
    prevBtn.style.position = 'absolute';
    prevBtn.style.left = '15px';
    prevBtn.style.top = '50%';
    prevBtn.style.transform = 'translateY(-50%)';
    prevBtn.style.backgroundColor = 'rgba(0,0,0,0.5)';
    prevBtn.style.color = 'white';
    prevBtn.style.border = 'none';
    prevBtn.style.borderRadius = '50%';
    prevBtn.style.width = '40px';
    prevBtn.style.height = '40px';
    prevBtn.style.cursor = 'pointer';
    prevBtn.style.fontSize = '18px';
    prevBtn.style.zIndex = '10';
    prevBtn.style.transition = 'all 0.3s ease';

    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '❯';
    nextBtn.style.position = 'absolute';
    nextBtn.style.right = '15px';
    nextBtn.style.top = '50%';
    nextBtn.style.transform = 'translateY(-50%)';
    nextBtn.style.backgroundColor = 'rgba(0,0,0,0.5)';
    nextBtn.style.color = 'white';
    nextBtn.style.border = 'none';
    nextBtn.style.borderRadius = '50%';
    nextBtn.style.width = '40px';
    nextBtn.style.height = '40px';
    nextBtn.style.cursor = 'pointer';
    nextBtn.style.fontSize = '18px';
    nextBtn.style.zIndex = '10';
    nextBtn.style.transition = 'all 0.3s ease';

    // Indicadores
    const indicators = document.createElement('div');
    indicators.style.textAlign = 'center';
    indicators.style.marginTop = '15px';

    // Crear indicadores
    for (let i = 0; i < totalImages; i++) {
      const dot = document.createElement('span');
      dot.style.display = 'inline-block';
      dot.style.width = '12px';
      dot.style.height = '12px';
      dot.style.borderRadius = '50%';
      dot.style.backgroundColor = i === 0 ? '#3498db' : '#bdc3c7';
      dot.style.margin = '0 5px';
      dot.style.cursor = 'pointer';
      dot.style.transition = 'background-color 0.3s ease';
      
      dot.addEventListener('click', () => goToSlide(i));
      indicators.appendChild(dot);
    }

    function updateSlider() {
      const translateX = -(current * (100 / totalImages));
      slider.style.transform = `translateX(${translateX}%)`;
      
      // Actualizar indicadores
      Array.from(indicators.children).forEach((dot, i) => {
        dot.style.backgroundColor = i === current ? '#3498db' : '#bdc3c7';
      });
    }

    function goToSlide(index) {
      current = index;
      updateSlider();
    }

    function nextSlide() {
      current = (current + 1) % totalImages;
      updateSlider();
    }

    function prevSlide() {
      current = (current - 1 + totalImages) % totalImages;
      updateSlider();
    }

    // Event listeners
    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);

    // Hover effects para botones
    [prevBtn, nextBtn].forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        btn.style.backgroundColor = 'rgba(0,0,0,0.8)';
        btn.style.transform = btn === prevBtn ? 'translateY(-50%) scale(1.1)' : 'translateY(-50%) scale(1.1)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.backgroundColor = 'rgba(0,0,0,0.5)';
        btn.style.transform = 'translateY(-50%) scale(1)';
      });
    });

    // Auto-play
    let autoPlayInterval = setInterval(nextSlide, 4000);

    // Pausar auto-play al hacer hover
    wrapper.addEventListener('mouseenter', () => {
      clearInterval(autoPlayInterval);
    });

    wrapper.addEventListener('mouseleave', () => {
      autoPlayInterval = setInterval(nextSlide, 4000);
    });

    // Ensamblar el carrusel
    carouselContainer.appendChild(slider);
    carouselContainer.appendChild(prevBtn);
    carouselContainer.appendChild(nextBtn);
    
    wrapper.appendChild(carouselContainer);
    wrapper.appendChild(indicators);

    return wrapper;
  }

  // Primera pasada: procesar elementos básicos
  for (let line of lines) {
    if (line.toUpperCase() === 'EVENTS:') {
      inEvents = true;
      continue;
    }

    if (inEvents) {
      const [left, right] = line.split('=');
      const aliasMatch = left?.match(/"(.+?)"/);
      if (!aliasMatch) continue;
      const alias = aliasMatch[1];
      const action = left.replace(aliasMatch[0], '').trim();
      pendingEvents.push({ alias, action, value: right.trim() });
      continue;
    }

    const [rawKey, rawVal] = line.split('=');
    if (!rawKey || !rawVal) continue;

    const key = rawKey.trim();
    const val = rawVal.trim();
    
    // Detectar si es un estilo
    if (key.includes('STYLE')) {
      const aliasMatch = key.match(/"(.+?)"/);
      if (aliasMatch) {
        pendingStyles.push({ alias: aliasMatch[1], style: val });
        continue;
      }
    }
    
    // Parsear la línea completa
    const parts = key.match(/^([A-Z]+)(?:\.(\w+))?(?:\s+(\w+))?(?:.*?"(.+?)")?(?:\s+(--\w+))?/i);
    if (!parts) continue;

    const section = parts[1];
    const extra = parts[2];
    const type = parts[3] || 'TEXT';
    const alias = parts[4] || null;
    const modifier = parts[5] || null; // --hide o --show
    const container = createSectionIfNeeded(section);
    let el;

    // Procesar diferentes tipos de elementos
    if (section === 'MAIN' && type === 'IMAGE' && !extra) {
      // Imagen simple
      el = document.createElement('img');
      el.src = val;
      el.style.maxWidth = '100%';
      el.style.height = 'auto';
      el.style.borderRadius = '10px';
      el.style.margin = '10px auto';
      el.style.display = 'block';
      el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
      
      // Aplicar modificador --hide
      if (modifier === '--hide') {
        el.style.display = 'none';
      }
      
      if (alias) {
        imageRefs[alias] = el;
        aliases[alias] = el;
      }
    }
    else if (section === 'MAIN' && extra === 'IMAGE' && type === 'CARRUSEL') {
      // Carrusel de imágenes
      const refAliases = val.replaceAll('"', '').split(/\s+/);
      el = createCarousel(refAliases, alias);
      
      // Aplicar modificador --hide
      if (modifier === '--hide') {
        el.style.display = 'none';
      }
      
      if (alias) {
        aliases[alias] = el;
      }
    }
    else if (section === 'MAIN' && type === 'TEXT') {
      // Texto
      el = document.createElement('p');
      el.textContent = val;
      el.style.marginBottom = '16px';
      el.style.fontSize = '16px';
      el.style.lineHeight = '1.6';
      
      // Aplicar modificador --hide
      if (modifier === '--hide') {
        el.style.display = 'none';
      }
      
      if (alias) {
        aliases[alias] = el;
      }
    }
    else if (section === 'MAIN' && type === 'BUTTON') {
      // Botón
      el = document.createElement('button');
      el.textContent = val;
      el.style.padding = '12px 24px';
      el.style.border = 'none';
      el.style.borderRadius = '8px';
      el.style.cursor = 'pointer';
      el.style.margin = '10px 5px 10px 0';
      el.style.fontSize = '16px';
      el.style.fontWeight = '500';
      el.style.transition = 'all 0.3s ease';
      el.style.background = '#3498db';
      el.style.color = '#fff';
      
      // Aplicar modificador --hide
      if (modifier === '--hide') {
        el.style.display = 'none';
      }
      
      if (alias) {
        aliases[alias] = el;
      }
    }
    else continue;

    if (el) {
      container.appendChild(el);
    }
  }

  // Aplicar estilos pendientes
  for (let styleData of pendingStyles) {
    const target = aliases[styleData.alias];
    if (target) {
      applyPresetStyle(target, styleData.style);
    }
  }

  // Aplicar eventos pendientes
  for (let evt of pendingEvents) {
    handleEvent(evt.alias, evt.action, evt.value);
  }

  // Añadir estilos CSS
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    .adz-section {
      padding: 25px;
      margin-bottom: 30px;
      background: #fafafa;
      border-radius: 15px;
      box-shadow: 0 3px 15px rgba(0,0,0,0.08);
      animation: fadeInSlide 0.8s ease;
    }
    
    .adz-carousel {
      margin: 20px auto;
    }
    
    @keyframes fadeInSlide {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeInShow {
      0% { opacity: 0; transform: scale(0.9); }
      100% { opacity: 1; transform: scale(1); }
    }
    
    button {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    
    button:active {
      transform: translateY(0);
    }
    
    @media (max-width: 600px) {
      body { 
        padding: 10px; 
        font-size: 16px; 
      }
      
      .adz-section {
        padding: 15px;
        margin-bottom: 20px;
      }
      
      button { 
        width: 100%; 
        margin: 5px 0 !important; 
      }
      
      .adz-carousel {
        margin: 15px auto;
      }
      
      .adz-carousel > div:first-child {
        height: 250px !important;
      }
      
      .adz-carousel button {
        width: 30px !important;
        height: 30px !important;
        font-size: 14px !important;
      }
    }
  `;
  document.head.appendChild(styleTag);
})();