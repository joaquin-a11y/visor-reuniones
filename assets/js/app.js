function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}
setInterval(updateClock, 1000);
updateClock();

function esc(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function parseAnyDate(value) {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime()) && String(value).includes('T')) return direct;

  const s = String(value).trim();

  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m) {
    let month = parseInt(m[1], 10) - 1;
    let day = parseInt(m[2], 10);
    let year = parseInt(m[3], 10);
    let hour = parseInt(m[4], 10);
    const minute = parseInt(m[5], 10);
    const ap = m[6].toUpperCase();

    if (ap === 'PM' && hour !== 12) hour += 12;
    if (ap === 'AM' && hour === 12) hour = 0;

    return new Date(year, month, day, hour, minute);
  }

  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    return new Date(parseInt(m[3], 10), parseInt(m[1], 10) - 1, parseInt(m[2], 10));
  }

  return null;
}

function formatTime(value) {
  const d = parseAnyDate(value);
  if (!d) return '';
  return d.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function localDateKey(value) {
  const d = parseAnyDate(value);
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getStart(ev) {
  return ev.start || ev.startDateTime || ev.date || ev.time || ev.HoraInicio || ev.horaInicio || ev.fechaInicio || '';
}

function getEnd(ev) {
  return ev.end || ev.endTime || ev.HoraFin || ev.horaFin || ev.fechaFin || '';
}

function getStatus(ev) {
  const now = new Date();
  const start = parseAnyDate(getStart(ev));
  const end = parseAnyDate(getEnd(ev));

  if (!start) return { status: 'proximo', label: 'Próximo' };
  if (end && now >= start && now <= end) return { status: 'en-curso', label: 'En curso' };
  if (now >= start && (!end || now > end)) return { status: 'finalizado', label: 'Finalizado' };
  return { status: 'proximo', label: 'Próximo' };
}

async function loadRooms() {
  const grid = document.getElementById('grid');
  const debug = document.getElementById('debug');

  try {
    const res = await fetch('/api/rooms');
    const data = await res.json();

    if (debug) {
      debug.textContent = JSON.stringify(data, null, 2);
    }

    const rooms = Array.isArray(data.rooms) ? data.rooms : [];
    const today = todayKey();

    if (!rooms.length) {
      grid.innerHTML = `<section class="card"><div class="empty">No hay datos</div></section>`;
      return;
    }

    grid.innerHTML = rooms.map(room => {
      const allEvents = Array.isArray(room.events) ? room.events : [];

      console.log('SALA:', room.name, allEvents);

      const todayEvents = allEvents
        .filter(ev => {
          const raw = getStart(ev);
          return raw && localDateKey(raw) === today;
        })
        .sort((a, b) => {
          const da = parseAnyDate(getStart(a));
          const db = parseAnyDate(getStart(b));
          return (da?.getTime() || 0) - (db?.getTime() || 0);
        });

      const count = todayEvents.length;

      const headerBadge = count
        ? `<span class="room-badge count">${count} Evento${count === 1 ? '' : 's'}</span>`
        : `<span class="room-badge available">Disponible</span>`;

      const body = count
        ? todayEvents.map(ev => {
            const st = getStatus(ev);
            const startValue = getStart(ev);

            return `
              <div class="event">
                <div class="time">${esc(formatTime(startValue))}</div>
                <div class="event-main">
                  <div class="event-title">${esc(ev.title || ev.subject || 'Sin título')}</div>
                  ${ev.organizer ? `<div class="event-meta">${esc(ev.organizer)}</div>` : ''}
                </div>
                <div class="status ${esc(st.status)}">${esc(st.label)}</div>
              </div>
            `;
          }).join('')
        : `<div class="empty">Sin reuniones hoy</div>`;

      return `
        <section class="card">
          <div class="room-header">
            <h2 class="room-title">${esc(room.name || 'Sin sala')}</h2>
            ${headerBadge}
          </div>
          <div class="card-body">
            ${body}
          </div>
        </section>
      `;
    }).join('');
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<section class="card"><div class="empty">Error al cargar datos</div></section>`;
  }
}

loadRooms();
setInterval(loadRooms, 60000);
