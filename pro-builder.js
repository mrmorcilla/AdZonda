(async () => {
  const response = await fetch('void.adzonda');
  const text = await response.text();
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  const body = document.body;
  body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
  body.style.margin = '20px auto';
  body.style.maxWidth = '900px';
  body.style.lineHeight = '1.6';
  body.style.color = '#333';

  const sections = {};
  const aliases = {};
  const pendingEvents = [];

  let inEvents = false;

  function createSectionIfNeeded(name) {
    if (!sections[name]) {
      const div = document.createElement('section');
      div.id = name.toLowerCase();
      div.style.padding = '20px';
      div.style.marginBottom = '30px';
      div.style.display = 'block';
      div.style.borderRadius = '12px';
      div.style.backgroundColor = '#fafafa';
      div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
      body.appendChild(div);
      sections[name] = div;
    }
    return sections[name];
  }

  function applyStyle(el, prop, val) {
    const p = prop.toUpperCase();
    const value = parseColor(val);
    switch (p) {
      case 'COLOR':
        el.style.color = value;
        break;
      case 'ALIGN':
        el.style.textAlign = val;
        break;
      case 'SIZE':
        el.style.fontSize = val;
        break;
      case 'BACKGROUND':
        if (value === 'rainbow') {
          el.style.backgroundImage = 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)';
          el.style.webkitBackgroundClip = 'text';
          el.style.webkitTextFillColor = 'transparent';
          el.style.backgroundClip = 'text';
          el.style.textFillColor = 'transparent';
        } else {
          el.style.backgroundColor = value;
        }
        break;
      case 'BORDER':
        el.style.border = val;
        break;
      default:
        break;
    }
  }

  function parseColor(name) {
    const colors = {
      rojo: '#e74c3c',
      azul: '#3498db',
      verde: '#27ae60',
      amarillo: '#f1c40f',
      negro: '#2c3e50',
      blanco: '#ecf0f1',
      naranja: '#e67e22',
      rosa: '#fd79a8',
      gris: '#7f8c8d',
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

      // Guardamos estilos originales para restaurar luego
      const originalColor = el.style.color || '';
      const originalTransform = el.style.transform || '';
      const originalTransition = el.style.transition || '';

      el.style.transition = 'all 0.3s ease';

      el.addEventListener('mouseenter', () => {
        if (color) el.style.color = color;
        if (scale) el.style.transform = `scale(${scale})`;
      });

      el.addEventListener('mouseleave', () => {
        el.style.color = originalColor;
        el.style.transform = originalTransform;
        el.style.transition = originalTransition;
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

      const aliasMatch = leftTrim.match(/"([^"]+)"/);
      if (!aliasMatch) {
        console.warn(`Alias no válido en línea: ${line}`);
        continue;
      }

      const alias = aliasMatch[1];
      const action = leftTrim.replace(aliasMatch[0], '').trim();

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

    switch (component.toUpperCase()) {
      case 'TEXT':
        el = document.createElement('p');
        el.textContent = val;
        el.style.marginBottom = '16px';
        break;

      case 'BUTTON':
        el = document.createElement('button');
        el.textContent = val;
        el.style.margin = '5px 10px 10px 0';
        el.style.padding = '10px 20px';
        el.style.borderRadius = '8px';
        el.style.border = 'none';
        el.style.background = '#3498db';
        el.style.color = '#fff';
        el.style.fontWeight = '600';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 3px 6px rgba(0, 0, 0, 0.1)';
        el.style.transition = 'background-color 0.3s ease';
        el.addEventListener('mouseenter', () => el.style.backgroundColor = '#2980b9');
        el.addEventListener('mouseleave', () => el.style.backgroundColor = '#3498db');
        break;

      case 'IMAGE':
        el = document.createElement('img');
        el.src = val;
        el.alt = alias || 'image';
        el.style.maxWidth = '100%';
        el.style.borderRadius = '12px';
        el.style.display = 'block';
        el.style.margin = '15px auto';
        el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        break;

      case 'COLOR':
      case 'ALIGN':
      case 'BACKGROUND':
      case 'SIZE':
      case 'BORDER':
        applyStyle(container, component, val);
        continue;

      default:
        el = document.createElement('div');
        el.textContent = val;
        el.style.marginBottom = '16px';
        break;
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
