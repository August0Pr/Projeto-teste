// Simple IndexedDB wrapper for players
const DB = (function(){
    const DB_NAME = 'vbl_db';
    const STORE = 'players';
    const VER = 1;
    let db;
  
    function openDB(){
      return new Promise((res, rej) => {
        if(db) return res(db);
        const rq = indexedDB.open(DB_NAME, VER);
        rq.onupgradeneeded = (e) => {
          const d = e.target.result;
          if(!d.objectStoreNames.contains(STORE)){
            const store = d.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
            store.createIndex('name', 'name', { unique: false });
            store.createIndex('score', 'score', { unique: false });
          }
        };
        rq.onsuccess = (e) => { db = e.target.result; res(db); };
        rq.onerror = (e) => rej(e.target.error);
      });
    }
  
    function tx(storeName, mode='readonly'){
      return openDB().then(d => d.transaction([storeName], mode).objectStore(storeName));
    }
  
    async function getAll(){
      const store = await tx(STORE, 'readonly');
      return new Promise((res, rej) => {
        const arr = [];
        const rq = store.openCursor();
        rq.onsuccess = e => {
          const cur = e.target.result;
          if(cur){ arr.push(cur.value); cur.continue(); }
          else res(arr);
        };
        rq.onerror = e => rej(e.target.error);
      });
    }
  
    async function add(item){
      const store = await tx(STORE, 'readwrite');
      return new Promise((res, rej) => {
        const rq = store.add(item);
        rq.onsuccess = e => res(e.target.result);
        rq.onerror = e => rej(e.target.error);
      });
    }
  
    async function put(item){
      const store = await tx(STORE, 'readwrite');
      return new Promise((res, rej) => {
        const rq = store.put(item);
        rq.onsuccess = e => res(e.target.result);
        rq.onerror = e => rej(e.target.error);
      });
    }
  
    async function remove(id){
      const store = await tx(STORE, 'readwrite');
      return new Promise((res, rej) => {
        const rq = store.delete(id);
        rq.onsuccess = () => res(true);
        rq.onerror = e => rej(e.target.error);
      });
    }
  
    return {
      getPlayers: async () => { await openDB(); return getAll(); },
      addPlayer: async (p) => { await openDB(); return add(p); },
      updatePlayer: async (p) => { await openDB(); return put(p); },
      deletePlayer: async (id) => { await openDB(); return remove(id); }
    };
  })();
  