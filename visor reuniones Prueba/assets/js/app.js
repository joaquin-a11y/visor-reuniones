function updateClock(){ 
  const now=new Date(); 
  document.getElementById('clock').textContent = now.toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}); 
}
setInterval(updateClock,1000);
updateClock();

async function loadRooms(){
  const grid=document.getElementById('grid');
  try{
    const res=await fetch('/api/rooms');
    const data=await res.json();
    const rooms=data.rooms || [];
    grid.innerHTML = rooms.map(room => {
      const events = room.events || [];
      if(!events.length) return `<section class="card"><h2 class="room-title">${room.name}</h2><div class="empty">Sin reuniones hoy</div></section>`;
      return `<section class="card"><h2 class="room-title">${room.name}</h2>${events.map(ev => `<div class="event"><div class="time">${ev.time}</div><div><div><b>${ev.title}</b></div><div style="color:#8fa3bf;font-size:12px">${ev.organizer || ''}</div></div><div class="status ${ev.status==='en-curso'?'on':ev.status==='disponible'?'free':''}">${ev.statusLabel}</div></div>`).join('')}</section>`;
    }).join('') || '<section class="card empty">No hay datos</section>';
  }catch(err){
    grid.innerHTML = `<section class="card"><h2 class="room-title">Error</h2><div class="empty">${err.message}</div></section>`;
  }
}
loadRooms();
setInterval(loadRooms,60000);