(async () => {
  const response = await fetch('void.structure');
  const text = await response.text();
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  const body = document.body;
  const sections = {};
  const aliases = {};
  const pendingEvents = [];

  let inEvents = false;

  function createSectionIfNeeded(name) {
    if (!sections[name]) {
      const div = document.createElement('div');
      div.id = name.toLowerCase();
      div.style.padding = '10px';
      div.style.marginBottom = '20px';
      div.style.display = 'block'; // Asegura visibilidad
      body.appendChild(div);
      sections[name] = div;
    }
    return sections[name];
  }

  function applyStyle(el, prop, val) {
    const p = prop.toUpperCase();
    if (p === 'COLOR') el.style.color = val;
    if (p === 'ALIGN') el.style.textAlign = val;
    if (p === 'SIZE') el.style.fontSize = val;
    if (p === 'BACKGROUND') el.style.backgroundColor = val;
    if (val.toLowerCase() === 'rainbow') {
      el.style.backgroundImage = 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)';
      el.style.webkitBackgroundClip = 'text';
      el.style.webkitTextFillColor = 'transparent';
    }
  }

  // Función para interpretar colores comunes en español/inglés simple
  function parseColor(name) {
    const colors = {
      rojo: 'red',
      azul: 'blue',
      verde: 'green',
      amarillo: 'yellow',
      negro: 'black',
      blanco: 'white',
      naranja: 'orange',
      rosa: 'pink',
      gris: 'gray',
      rainbow: 'rainbow'
    };
    return colors[name.toLowerCase()] || name;
  }

  function handleEvent(alias, action, value) {
    const el = aliases[alias];
    if (!el) {
      console.warn(`No se encontró el alias "${alias}"`);
      return;
    }

    const act = action.toUpperCase().replace(/[\s_-]/g, '');

    if (act === 'REDIRECT') {
      el.style.cursor = 'pointer';
      el.onclick = () => window.location.href = value;
    } else if (act === 'HIDEONCLICK') {
      el.style.cursor = 'pointer';
      el.onclick = () => el.style.display = 'none';
    } else if (act === 'HIDE') {
      el.style.display = 'none';
    } else if (act === 'HOVER') {
      // Parseamos valor simple: ejemplo "COLOR ROJO SCALE 1.05"
      const props = value.trim().split(/\s+/);
      let color = null;
      let scale = null;

      for (let i = 0; i < props.length; i++) {
        if (props[i] === 'COLOR' && i + 1 < props.length) {
          color = parseColor(props[i + 1]);
          i++;
        } else if (props[i] === 'SCALE' && i + 1 < props.length) {
          scale = props[i + 1];
          i++;
        }
      }

      const originalStyle = el.getAttribute('style') || '';

      el.addEventListener('mouseenter', () => {
        if (color) el.style.color = color;
        if (scale) el.style.transform = `scale(${scale})`;
      });

      el.addEventListener('mouseleave', () => {
        el.style.cssText = originalStyle;
      });

    } else if (act === 'CLICK') {
      const parts = value.trim().split(/\s+/);
      const cmd = parts[0].toUpperCase();

      if (cmd === 'ALERT') {
        const alertMsg = parts.slice(1).join(' ');
        el.style.cursor = 'pointer';
        el.onclick = () => alert(alertMsg);
      } else if (cmd === 'REDIRECT') {
        const url = parts.slice(1).join(' ');
        el.style.cursor = 'pointer';
        el.onclick = () => window.location.href = url;
      } else {
        console.warn(`Acción CLICK no soportada para: ${value}`);
      }
    }
  }

  for (let line of lines) {
    if (line.toUpperCase() === 'EVENTS:' || line.toUpperCase() === 'EVENTS') {
      inEvents = true;
      continue;
    }

    if (inEvents) {
      const [left, right] = line.split('=');
      if (!left) continue;

      const leftTrim = left.trim();
      const rightTrim = right ? right.trim() : '';

      // Extraer alias (entre comillas)
      const aliasMatch = leftTrim.match(/"([^"]+)"/);
      if (!aliasMatch) {
        console.warn(`Alias no válido en línea: ${line}`);
        continue;
      }

      const alias = aliasMatch[1]; // Ej: imagen1

      // Acción = todo lo que sobra en leftTrim menos el alias (y espacios)
      const action = leftTrim.replace(aliasMatch[0], '').trim(); // Ej: HOVER, CLICK, HIDE ON CLICK

      pendingEvents.push({ alias, action, value: rightTrim });
      continue;
    }

    if (!line.includes('=')) continue;

    const [rawKey, rawVal] = line.split('=');
    const key = rawKey.trim();
    const val = rawVal.trim();

    const parts = key.match(/^(\w+)(?:\s+(\w+))?(?:\s+"(.+?)")?$/);

    if (!parts) continue;

    const section = parts[1];
    const component = parts[2] || 'TEXT';
    const alias = parts[3] || null;

    const container = createSectionIfNeeded(section);
    let el;

    if (component === 'TEXT') {
      el = document.createElement('p');
      el.textContent = val;
    } else if (component === 'BUTTON') {
      el = document.createElement('button');
      el.textContent = val;
      el.style.margin = '5px';
      el.style.padding = '6px 14px';
      el.style.borderRadius = '6px';
      el.style.border = 'none';
      el.style.background = '#eee';
      el.style.cursor = 'pointer';
    } else if (component === 'IMAGE') {
      el = document.createElement('img');
      el.src = val;
      el.alt = alias || 'image';
      el.style.maxWidth = '100%';
      el.style.borderRadius = '8px';
      el.style.display = 'block';
      el.style.margin = '10px auto';
    } else if (['COLOR', 'ALIGN', 'BACKGROUND', 'SIZE'].includes(component.toUpperCase())) {
      applyStyle(container, component, val);
      continue;
    } else {
      el = document.createElement('div');
      el.textContent = val;
    }

    if (alias) {
      el.dataset.alias = alias;
      aliases[alias] = el;
    }

    container.appendChild(el);
  }

  for (let evt of pendingEvents) {
    handleEvent(evt.alias, evt.action, evt.value);
  }
})();
