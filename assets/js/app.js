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

function formatTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(11, 16) || '';
  return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

async function loadRooms() {
  const grid = document.getElementById('grid');

  try {
    const res = await fetch('/api/rooms');
    const data = await res.json();
    const rooms = Array.isArray(data.rooms) ? data.rooms : [];
    const today = new Date();

    const filteredRooms = rooms
      .map(room => {
        const events = Array.isArray(room.events) ? room.events : [];
        const todayEvents = events.filter(ev => {
          const d = new Date(ev.time || ev.start || ev.startDateTime || ev.date);
          return !Number.isNaN(d.getTime()) && isSameDay(d, today);
        });
        return { ...room, events: todayEvents };
      })
      .filter(room => room.events.length > 0);

    if (!filteredRooms.length) {
      grid.innerHTML = `<section class="card"><div class="empty">No hay reuniones hoy</div></section>`;
      return;
    }

    grid.innerHTML = filteredRooms.map(room => {
      const events = room.events;
      const count = events.length;

      const headerBadge = count
        ? `<span class="room-badge count">${count} Evento${count === 1 ? '' : 's'}</span>`
        : `<span class="room-badge available">Disponible</span>`;

      const body = count
        ? events.map(ev => {
            const status = ev.status || 'proximo';
            const statusLabel = ev.statusLabel || 'Próximo';
            const timeValue = ev.time || ev.start || ev.startDateTime || ev.date;

            return `
              <div class="event">
                <div class="time">${esc(formatTime(timeValue))}</div>
                <div class="event-main">
                  <div class="event-title">${esc(ev.title || ev.subject || 'Sin título')}</div>
                  ${ev.organizer ? `<div class="event-meta">${esc(ev.organizer)}</div>` : ''}
                </div>
                <div class="status ${esc(status)}">${esc(statusLabel)}</div>
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
    grid.innerHTML = `<section class="card"><div class="empty">Error al cargar datos</div></section>`;
  }
}

loadRooms();
setInterval(loadRooms, 60000);
