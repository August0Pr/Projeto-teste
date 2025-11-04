// Admin logic: login + CRUD (uses DB)
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'VBLadmin2025!';

function el(id){ return document.getElementById(id); }
async function renderAdminTable(){
  const tbody = document.querySelector('#adminTable tbody');
  tbody.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';
  try{
    const list = await DB.getPlayers();
    if(!list || list.length === 0){
      tbody.innerHTML = '<tr><td colspan="5">Nenhum jogador cadastrado.</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    list.forEach((p, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i+1}</td><td>${escapeHtml(p.name)}</td><td>${escapeHtml(p.score)}</td><td>${escapeHtml(p.team||'—')}</td>
        <td>
          <button class="action-btn edit" data-id="${p.id}">Editar</button>
          <button class="action-btn remove" data-id="${p.id}">Excluir</button>
        </td>`;
      tbody.appendChild(tr);
    });
  }catch(err){
    tbody.innerHTML = '<tr><td colspan="5">Erro ao carregar jogadores.</td></tr>';
    console.error(err);
  }
}
function escapeHtml(s){ if(s===undefined||s===null) return ''; return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function setAdminEnabled(enabled){
  const adminArea = el('adminArea');
  if(enabled){
    adminArea.classList.remove('locked');
    adminArea.setAttribute('aria-disabled','false');
    el('btnLogout').style.display = 'inline-block';
    el('loginMsg').style.color = 'lime';
    el('loginMsg').textContent = 'Autenticado como administrador.';
  } else {
    adminArea.classList.add('locked');
    adminArea.setAttribute('aria-disabled','true');
    el('btnLogout').style.display = 'none';
    el('loginMsg').style.color = '';
    el('loginMsg').textContent = 'Informe credenciais para desbloquear o painel';
  }
  // apply disabled to controls inside adminArea
  document.querySelectorAll('#adminArea input, #adminArea button').forEach(elm=>{
    elm.disabled = !enabled;
    elm.setAttribute('aria-disabled', (!enabled).toString());
    elm.style.pointerEvents = enabled ? 'auto' : 'none';
    elm.style.opacity = enabled ? '1' : '0.6';
  });
  // keep logout button enabled outside
  el('btnLogout').disabled = false;
}

function isAuthed(){ return localStorage.getItem('vbl_admin_auth') === 'true'; }

async function tryLogin(){
  const user = el('loginUser').value.trim();
  const pass = el('loginPass').value;
  if(user === ADMIN_USER && pass === ADMIN_PASS){
    localStorage.setItem('vbl_admin_auth','true');
    setAdminEnabled(true);
    await renderAdminTable();
    el('loginUser').value=''; el('loginPass').value='';
  } else {
    el('loginMsg').style.color = 'crimson';
    el('loginMsg').textContent = 'Usuário ou senha incorretos.';
  }
}

function doLogout(){
  localStorage.removeItem('vbl_admin_auth');
  setAdminEnabled(false);
}

async function addPlayer(){
  const name = el('pName').value.trim();
  const score = el('pScore').value.trim();
  const team = el('pTeam').value.trim();
  if(!name || !score){ alert('Nome e pontuação são obrigatórios.'); return; }
  await DB.addPlayer({ name, score, team });
  el('pName').value=''; el('pScore').value=''; el('pTeam').value='';
  await renderAdminTable();
}

document.addEventListener('DOMContentLoaded', async ()=>{
  // wire events
  el('btnLogin').addEventListener('click', tryLogin);
  el('btnLogout').addEventListener('click', doLogout);
  el('btnAdd').addEventListener('click', addPlayer);

  document.querySelector('#adminTable tbody').addEventListener('click', async (e)=>{
    const btn = e.target.closest('button'); if(!btn) return;
    const id = Number(btn.dataset.id);
    if(btn.classList.contains('remove')){
      if(!confirm('Confirma exclusão?')) return;
      await DB.deletePlayer(id);
      await renderAdminTable();
    } else if(btn.classList.contains('edit')){
      const list = await DB.getPlayers();
      const rec = list.find(x=>x.id===id);
      if(!rec) return alert('Registro não encontrado.');
      const newName = prompt('Nome', rec.name); if(newName === null) return;
      const newScore = prompt('Pontuação', rec.score); if(newScore === null) return;
      const newTeam = prompt('Time', rec.team || ''); if(newTeam === null) return;
      rec.name = newName; rec.score = newScore; rec.team = newTeam;
      await DB.updatePlayer(rec);
      await renderAdminTable();
    }
  });

  // init
  try { await DB.getPlayers(); } catch(e){ console.warn('DB init error', e); }
  if(isAuthed()){ setAdminEnabled(true); await renderAdminTable(); } else { setAdminEnabled(false); }
});
