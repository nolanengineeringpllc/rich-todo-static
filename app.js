// ========= API =========
const API_URL = 'https://script.google.com/macros/s/AKfycbyb1nU9ryTTaOVzPezOdFLCyoGMZsQ1SxYGRpa5mc65HfgIiq_KusXPfuvSTDO_lJqzUQ/exec';

const CATS = [
  'Drawings to Review',
  'Reports to Write',
  'Reports to Review',
  'Other'
];

// ========= API helpers =========
async function apiGet() {
  const res = await fetch(API_URL);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'API error');
  return json.data;
}
async function apiPost(body) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'API error');
  return json.data;
}

// ========= CRUD =========
async function loadTasks() {
  try {
    const tasks = await apiGet();
    renderBoard(tasks);
  } catch (err) {
    console.error('Load error:', err);
    alert('Error loading tasks. See console.');
  }
}
async function addTask(title, owner, category, notes) {
  try {
    const id = (crypto?.randomUUID?.() || String(Date.now()));
    const added = new Date().toISOString().slice(0,10);
    await apiPost({ action:'add', task:{ id, title, owner, category, added, notes } });
    await loadTasks();
  } catch (err) {
    console.error('Add error:', err);
    alert('Could not add task.');
  }
}
async function toggleTask(id) {
  try { await apiPost({ action:'toggle', id }); await loadTasks(); }
  catch (err) { console.error('Toggle error:', err); }
}
async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  try { await apiPost({ action:'delete', id }); await loadTasks(); }
  catch (err) { console.error('Delete error:', err); }
}

// ========= Render =========
function renderBoard(all) {
  const buckets = {
    'Drawings to Review': [],
    'Reports to Write':   [],
    'Reports to Review':  [],
    'Other':              [],
    completed:            []
  };

  all.forEach(t => {
    if (t.done) buckets.completed.push(t);
    else if (CATS.includes(t.category)) buckets[t.category].push(t);
    else buckets['Other'].push(t);
  });

  fillList('col-drawings', buckets['Drawings to Review']);
  fillList('col-write',   buckets['Reports to Write']);
  fillList('col-review',  buckets['Reports to Review']);
  fillList('col-other',   buckets['Other']);
  fillList('completed',   buckets.completed, true);
}

function fillList(id, items, completed=false) {
  const ul = document.getElementById(id);
  ul.innerHTML = '';
  if (!items.length) {
    const li = document.createElement('li');
    li.className = 'meta';
    li.textContent = completed ? 'No completed tasks.' : 'No tasks.';
    ul.appendChild(li);
    return;
  }

  items.forEach(t => {
    const li = document.createElement('li');
    li.className = 'cardlet';
    li.innerHTML = `
      <div>
        <div><strong>${escapeHtml(t.title)}</strong></div>
        <div class="meta">${escapeHtml(t.owner || '')} • ${escapeHtml(t.category || '')} • ${escapeHtml(t.added || '')}</div>
        ${t.notes ? `<div class="meta">${escapeHtml(t.notes)}</div>` : ''}
      </div>
      <div class="actions">
        <button class="btn" data-act="toggle">${t.done ? 'Undo' : 'Done'}</button>
        <button class="btn delete" data-act="delete">Delete</button>
      </div>
    `;
    li.querySelector('[data-act="toggle"]').onclick = () => toggleTask(t.id);
    li.querySelector('[data-act="delete"]').onclick = () => deleteTask(t.id);
    if (completed) li.classList.add('done');
    document.getElementById(id).appendChild(li);
  });
}

function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

// ========= DOM hooks =========
document.addEventListener('DOMContentLoaded', () => {
  // category chips
  const catSelect = document.getElementById('category');
  document.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      catSelect.value = btn.dataset.cat;
    });
  });

  // add form
  const form = document.getElementById('taskForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value.trim();
    const owner = document.getElementById('owner').value.trim();
    const category = document.getElementById('category').value;
    const notes = document.getElementById('notes').value.trim();
    if (!title) return alert('Please enter a title.');
    addTask(title, owner, category, notes);
    form.reset();
    document.querySelectorAll('.chip').forEach(b=>b.classList.remove('active'));
  });

  loadTasks();
});
