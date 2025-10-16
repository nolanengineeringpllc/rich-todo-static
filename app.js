// ===============================
// Rich's To-Do (Sections) – Client
// ===============================

// ---- Backend endpoint (your fresh Apps Script Web App URL)
const API_URL = "https://script.google.com/macros/s/AKfycbzD6OBdvGw6SW_g024ot2_k-OLiJzaOr-srfhyGWSrdyrj6swQLNzJb2FgvD-5jOcdPww/exec";

// ---- Section labels (display only)
const LABELS = {
  drawings: "Drawings to Review",
  write: "Reports to Write",
  review: "Reports to Review",
  other: "Other",
};

// ---- DOM
const toggleFormBtn = document.getElementById("toggleFormBtn");
const toggleCompletedBtn = document.getElementById("toggleCompletedBtn");
const completedSection = document.getElementById("completedSection");

const listEls = {
  drawings: document.getElementById("list_drawings"),
  write: document.getElementById("list_write"),
  review: document.getElementById("list_review"),
  other: document.getElementById("list_other"),
  completed: document.getElementById("list_completed"),
};

const addForm = document.getElementById("addForm");
const f_title = document.getElementById("f_title");
const f_owner = document.getElementById("f_owner");
const f_category = document.getElementById("f_category");
const f_added = document.getElementById("f_added");
const f_notes = document.getElementById("f_notes");
const saveTaskBtn = document.getElementById("saveTaskBtn");
const cancelFormBtn = document.getElementById("cancelFormBtn");

// ---- State & helpers
let tasks = [];
const todayISO = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const show = el => (el.style.display = "");
const hide = el => (el.style.display = "none");
const escapeHtml = s =>
  String(s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ======================
// API (GET + no-cors POST)
// ======================

// List (GET returns JSON)
async function apiList() {
  const res = await fetch(`${API_URL}?action=list&_=${Date.now()}`, { method: "GET" });
  if (!res.ok) throw new Error("list failed");
  return res.json();
}

// Add / Toggle / Delete use no-cors to avoid preflight; we then reload state.
// (Apps Script updates the sheet; we read fresh via apiList afterwards.)

async function apiAdd(task) {
  await fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action: "add", task }),
  });
  return { ok: true };
}

async function apiToggle(id) {
  await fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action: "toggle", id }),
  });
  return { ok: true };
}

async function apiDelete(id) {
  await fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action: "delete", id }),
  });
  return { ok: true };
}

// ==============
// Render helpers
// ==============
function renderOpenList(key) {
  const el = listEls[key];
  el.innerHTML = "";

  const items = tasks
    .filter(t => !t.done && t.category === key)
    .sort((a, b) => String(a.added).localeCompare(String(b.added)));

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "task";
    empty.style.opacity = ".6";
    empty.textContent = "No tasks yet.";
    el.appendChild(empty);
    return;
  }

  for (const t of items) {
    const row = document.createElement("div");
    row.className = "task";
    row.innerHTML = `
      <div>
        <div style="font-weight:600">${escapeHtml(t.title)}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px">
          <b>Owner:</b> ${escapeHtml(t.owner || "—")} &nbsp;•&nbsp;
          <b>Added:</b> ${escapeHtml(t.added || "—")}
          ${t.notes ? `&nbsp;•&nbsp;<b>Notes:</b> ${escapeHtml(t.notes)}` : ""}
        </div>
      </div>
      <div>
        <button class="btn" data-action="done" title="Mark complete">✔</button>
        <button class="btn" data-action="delete" style="margin-left:6px;background:#ef4444" title="Delete">🗑</button>
      </div>
    `;
    row.querySelector('[data-action="done"]').onclick = async () => {
      await apiToggle(t.id);
      await loadAndRender();
    };
    row.querySelector('[data-action="delete"]').onclick = async () => {
      if (confirm("Delete this task?")) {
        await apiDelete(t.id);
        await loadAndRender();
      }
    };
    el.appendChild(row);
  }
}

function renderCompleted() {
  const el = listEls.completed;
  el.innerHTML = "";

  const items = tasks
    .filter(t => t.done)
    .sort((a, b) => String(b.completed).localeCompare(String(a.completed)));

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "task";
    empty.style.opacity = ".6";
    empty.textContent = "No completed tasks yet.";
    el.appendChild(empty);
    return;
  }

  for (const t of items) {
    const row = document.createElement("div");
    row.className = "task done";
    row.innerHTML = `
      <div>
        <div style="font-weight:600">${escapeHtml(t.title)}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px">
          <b>Owner:</b> ${escapeHtml(t.owner || "—")} &nbsp;•&nbsp;
          <b>Category:</b> ${escapeHtml(LABELS[t.category] || t.category)} &nbsp;•&nbsp;
          <b>Added:</b> ${escapeHtml(t.added || "—")} &nbsp;•&nbsp;
          <b>Completed:</b> ${escapeHtml(t.completed || "—")}
          ${t.notes ? `&nbsp;•&nbsp;<b>Notes:</b> ${escapeHtml(t.notes)}` : ""}
        </div>
      </div>
    `;
    el.appendChild(row);
  }
}

function renderAll() {
  renderOpenList("drawings");
  renderOpenList("write");
  renderOpenList("review");
  renderOpenList("other");
  if (completedSection.style.display !== "none") renderCompleted();
}

// ==============
// Load & refresh
// ==============
async function loadAndRender() {
  try {
    tasks = await apiList();
  } catch (e) {
    console.error("List failed:", e);
    tasks = [];
  }
  renderAll();
}

// ============
// Form events
// ============
function clearForm() {
  f_title.value = "";
  f_owner.value = "";
  f_category.value = "drawings";
  f_added.value = todayISO();
  f_notes.value = "";
}

toggleFormBtn.onclick = () => {
  if (!addForm.style.display || addForm.style.display === "none") {
    clearForm();
    show(addForm);
  } else {
    hide(addForm);
  }
};

toggleCompletedBtn.onclick = () => {
  const hidden = !completedSection.style.display || completedSection.style.display === "none";
  if (hidden) {
    show(completedSection);
    toggleCompletedBtn.textContent = "Hide Completed";
    renderCompleted();
  } else {
    hide(completedSection);
    toggleCompletedBtn.textContent = "Show Completed";
  }
};

cancelFormBtn.onclick = () => hide(addForm);

saveTaskBtn.onclick = async () => {
  const title = (f_title.value || "").trim();
  if (!title) return alert("Please enter a task title.");

  const task = {
    id: uid(),
    title,
    owner: (f_owner.value || "").trim(),
    category: f_category.value, // drawings | write | review | other
    added: f_added.value || todayISO(),
    notes: (f_notes.value || "").trim(),
    done: false,
    completed: "",
  };

  try {
    await apiAdd(task);
    hide(addForm);
    await loadAndRender();
  } catch (e) {
    console.error(e);
    alert("Could not save task. Check network/permissions and try again.");
  }
};

// Auto-refresh for the smartboard view
setInterval(loadAndRender, 15000);

// Init
f_added.value = todayISO();
loadAndRender();
