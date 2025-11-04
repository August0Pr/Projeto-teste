// Populate ranking table and home widgets using DB
function escapeHtml(s){
    if(s === undefined || s === null) return '';
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function escapeInitials(name){
    if(!name) return '';
    const parts = name.split(/\s+/).filter(Boolean);
    if(parts.length === 0) return '';
    if(parts.length === 1) return parts[0].slice(0,2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  
  async function refreshRanking(){ // used by ranking.html
    const tbody = document.querySelector('#rankingTable tbody');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';
    let list = await DB.getPlayers();
    const sortSel = document.getElementById('sortSelect');
    if(sortSel){
      const val = sortSel.value;
      if(val === 'score_asc') list.sort((a,b)=>Number(a.score)-Number(b.score));
      else if(val === 'name_asc') list.sort((a,b)=>a.name.localeCompare(b.name));
      else list.sort((a,b)=>Number(b.score)-Number(a.score));
    } else {
      list.sort((a,b)=>Number(b.score)-Number(a.score));
    }
  
    if(list.length === 0){
      tbody.innerHTML = '<tr><td colspan="4">Nenhum jogador cadastrado.</td></tr>';
      return;
    }
  
    tbody.innerHTML = '';
    list.forEach((p, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i+1}</td><td>${escapeHtml(p.name)}</td><td>${escapeHtml(p.score)}</td><td>${escapeHtml(p.team||'—')}</td>`;
      tbody.appendChild(tr);
    });
  }
  
  // Home widgets (top players & teams)
  async function refreshHomeWidgets(){
    try{
      const list = await DB.getPlayers();
      const homeCountEl = document.getElementById('homeCountLarge');
      if(homeCountEl) homeCountEl.innerText = list.length;
  
      const visitsKey = 'vbl_visits_counter';
      const visits = Number(localStorage.getItem(visitsKey) || 0) + 1;
      localStorage.setItem(visitsKey, visits);
      const visitsEl = document.getElementById('visits');
      if(visitsEl) visitsEl.innerText = visits.toLocaleString();
  
      const activeToday = Math.max(0, Math.round(list.length * 0.1));
      const activeEl = document.getElementById('activeToday');
      if(activeEl) activeEl.innerText = activeToday;
  
      // top players
      const topListEl = document.getElementById('topPlayersList');
      if(topListEl){
        topListEl.innerHTML = '';
        if(!list || list.length === 0) topListEl.innerHTML = '<li class="empty-note">Nenhum jogador ainda — adicione pelo painel admin.</li>';
        else {
          const sorted = list.slice().sort((a,b)=>Number(b.score)-Number(a.score)).slice(0,5);
          sorted.forEach(p=>{
            const li = document.createElement('li');
            li.innerHTML = `<div class="avatar"></div><div class="name">${escapeHtml(p.name)}</div><div class="score">${escapeHtml(p.score)}</div>`;
            topListEl.appendChild(li);
          });
        }
      }
  
      // top teams
      const teams = {};
      list.forEach(p=>{
        const t = (p.team||'').trim();
        if(!t) return;
        if(!teams[t]) teams[t] = { totalScore: 0, count: 0};
        teams[t].totalScore += Number(p.score) || 0;
        teams[t].count += 1;
      });
      const teamsArr = Object.keys(teams).map(name=>({name, totalScore: teams[name].totalScore, count: teams[name].count}));
      teamsArr.sort((a,b)=>b.totalScore - a.totalScore);
      const topTeams = teamsArr.slice(0,5);
      const topTeamsEl = document.getElementById('topTeamsList');
      if(topTeamsEl){
        topTeamsEl.innerHTML = '';
        if(topTeams.length === 0) topTeamsEl.innerHTML = '<li class="empty-note">Nenhum time ainda — jogadores sem time não contam.</li>';
        else {
          topTeams.forEach(t=>{
            const li = document.createElement('li');
            li.innerHTML = `<div class="team-badge">${escapeInitials(t.name)}</div><div class="team-name">${escapeHtml(t.name)}</div><div class="team-score">${t.totalScore} pts • ${t.count} jogadores</div>`;
            topTeamsEl.appendChild(li);
          });
        }
      }
  
    }catch(err){
      console.error('Erro ao atualizar widgets da home:', err);
    }
  }
  
  document.addEventListener('DOMContentLoaded', ()=>{
    refreshHomeWidgets();
    refreshRanking();
    const sortSel = document.getElementById('sortSelect');
    const refreshBtn = document.getElementById('refreshBtn');
    if(sortSel) sortSel.addEventListener('change', refreshRanking);
    if(refreshBtn) refreshBtn.addEventListener('click', refreshRanking);
  });
  