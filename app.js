// ======================================================
// Nolan Engineering To-Do Dashboard - Frontend Logic
// Backend: Google Apps Script linked to Google Sheet
// ======================================================

// 🔗 Your live backend URL
const API_URL = 'https://script.google.com/macros/s/AKfycbyb1nU9ryTTaOVzPezOdFLCyoGMZsQ1SxYGRpa5mc65HfgIiq_KusXPfuvSTDO_lJqzUQ/exec';

// ======================================================
// Helper functions to talk to the backend
// ======================================================

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

// ======================================================
// CRUD actions
// ======================================================

async function loadTasks() {
  try {
    const tasks = await apiGet();
    renderTasks(tasks);
  } catch (err) {
    console.error('Failed to load tasks:', err);
    alert('Error loading tasks. Check console for details.');
  }
}

async function addTask(title, owner, category, notes) {
  try {
    const id = (crypto?.randomUUID?.() || String(Date.now()));
    const added = new Date().toISOString().slice(0, 10);
    await apiPost({
      action: 'add',
      task: { id, title, owner, category, added, notes },
    });
    await loadTasks();
  } catch (err) {
    console.error('Add task failed:', err);
    alert('Could not add task.');
  }
}

async function toggleTask(id) {
  try {
    await apiPost({ action: 'toggle', id });
    await loadTasks();
  } catch (err) {
    console.error('Toggle failed:', err);
  }
}

async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  try {
    await apiPost({ action: 'delete', id });
    await loadTasks();
  } catch (err) {
    console.error('Delete failed:', err);
  }
}

// ======================================================
// Rendering the tasks table
// ======================================================

function renderTasks(tasks) {
  const table = document.getElementById('tasksTableBody');
  table.innerHTML = '';

  if (!tasks.length) {
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="6" style="text-align:center; color:#888;">No tasks yet.</td>`;
    table.appendChild(row);
    return;
  }

  tasks.forEach((t) => {
    const tr = document.createElement('tr');
    tr.className = t.done ? 'done' : '';

    tr.innerHTML = `
      <td>${t.title}</td>
      <td>${t.owner || ''}</td>
      <td>${t.category || ''}</td>
      <td>${t.added || ''}</td>
      <td>${t.notes || ''}</td>
      <td>
        <button class="toggle">${t.done ? 'Undo' : 'Done'}</button>
        <button class="delete">Delete</button>
      </td>
    `;

    // Attach actions
    tr.querySelector('.toggle').onclick = () => toggleTask(t.id);
    tr.querySelector('.delete').onclick = () => deleteTask(t.id);

    table.appendChild(tr);
  });
}

// ======================================================
// Event listeners for the form
// ======================================================

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('taskForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value.trim();
    const owner = document.getElementById('owner').value.trim();
    const category = document.getElementById('category').value.trim();
    const notes = document.getElementById('notes').value.trim();

    if (!title) {
      alert('Please enter a task title.');
      return;
    }

    addTask(title, owner, category, notes);
    form.reset();
  });

  loadTasks(); // initial load
});

