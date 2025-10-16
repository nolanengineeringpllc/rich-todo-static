// ====== Rich's To-Do client (v106) ======
console.log("ToDo client v106");

// 1) Put YOUR fresh Web App URL here (the one you just deployed)
const API_URL = "https://script.google.com/macros/s/AKfycbzD6OBdvGw6SW_g024ot2_k-OLiJzaOr-srfhyGWSrdyrj6swQLNzJb2FgvD-5jOcdPww/exec";  // e.g. https://script.google.com/macros/s/…/exec

// 2) Labels for sections
const LABELS = {
  drawings: "Drawings to Review",
  write: "Reports to Write",
  review: "Reports to Review",
  other: "Other",
};

// ===== DOM =====
const toggleFormBtn       = document.getElementById("toggleFormBtn");
const toggleCompletedBtn  = document.getElementById("toggleCompletedBtn");
const completedSection    = document.getElementById("completedSection");

const listEls = {
  drawings:  document.getElementById("list_drawings"),
  write:     document.getElementById("list_write"),
  review:    document.getElementById("list_review"),
  other:     document.getElementById("list_other"),
  completed: document.getElementById("list_completed"),
};

const addForm     = document.getElementById("addForm");
const f_title     = document.getElementById("f_title");
const f_owner     = document.getElementById("f_owner");
const f_category  = document.getElementById("f_category");
const f_added     = document.getElementById("f_added");
const f_notes     = document.getElementById("f_notes");
const saveTaskBtn = document.getElementById("saveTaskBtn");
const cancelFormBtn = document.getElementById("cancelFormBtn");

// ===== STATE/UTIL =====
let tasks = [];
const todayISO = () => new Date().toISOString().slice(0,10);
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const escapeHtml = s => String(s||"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

// ===== API (always JSON; POST as text/plain) =====
async function apiGet(params) {
  const url = API_URL + (params ? ("?" + new URLSearchParams(params)) : "");
  const res = await fetch(url, { method: "GET" });
  const txt = await res.text();
  try {
    return JSON.parse(txt);
  } catch (e) {
    console.error("GET non-JSON:", txt);
    throw new Error("Backend returned non-JSON");
  }
}
async function apiPost(payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  });
  const txt = await res.text();
  try {
    return JSON.parse(txt);
  } catch (e) {
    console.error("POST non-JSON:", txt);
    throw new Error("Backend returned non-JSON");
  }
}

async function listTasks() {
  const j = await apiGet({ action: "list" });
  if (!j.ok) throw new Error(j.error || "List failed");
  return j.data || [];
}
async function addTask(task) {
  const j = await apiPost({ action: "add", task });
  if (!j.ok) throw new Error(j.error || "Add failed");
  return j.data;
}
async function toggleTask(id) {
  const j = await apiPost({ action: "toggle", id });
  if (!j.ok) throw new Error(j.error || "Toggle failed");
  return j.data;
}
async function deleteTask(id) {
  const j = await apiPost({ action: "delete", id });
  if (!j.ok) throw new Error(j.error || "Delete failed");
  return j.data;
}

// ===== RENDER =====
function renderOpenList(key) {
  const el = listEls[key];
  el.innerHTML = "";

  const items = tasks
    .filter(t => !t.done && t.category === key)
    .sort((a,b) => String(a.added).localeCompare(String(b.added)));

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "task";
    empty.style.opacity = ".6";
    empty.textContent = "No tasks yet.";
    el.appendChild(empty);
    return;
  }

  items.forEach(t => {
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
        <button class="btn" data-action="done">✔</button>
        <button class="btn" data-action="delete" style="margin-left:6px;background:#ef4444">🗑</button>
      </div>
    `;
    row.querySelector('[data-action="done"]').onclick = async () => {
      try { await toggleTask(t.id); await loadAndRender(); }
      catch (e) { alert("Could not toggle: " + e.message); }
    };
    row.querySelector('[data-action="delete"]').onclick = async () => {
      if (!confirm("Delete this task?")) return;
      try { await deleteTask(t.id); await loadAndRender(); }
      catch (e) { alert("Could not delete: " + e.message); }
    };
    el.appendChild(row);
  });
}

function renderCompleted() {
  const el = listEls.completed;
  el.innerHTML = "";

  const items = tasks
    .filter(t => t.done)
    .sort((a,b) => String(b.completed).localeCompare(String(a.completed)));

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "task";
    empty.style.opacity = ".6";
    empty.textContent = "No completed tasks yet.";
    el.appendChild(empty);
    return;
  }

  items.forEach(t => {
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
  });
}

function renderAll() {
  renderOpenList("drawings");
  renderOpenList("write");
  renderOpenList("review");
  renderOpenList("other");
  if (completedSection.style.display !== "none") renderCompleted();
}

// ===== LOAD =====
async function loadAndRender() {
  try { tasks = await listTasks(); }
  catch (e) { console.error(e); tasks = []; alert("Could not load tasks: " + e.message); }
  renderAll();
}

// ===== FORM =====
function clearForm() {
  f_title.value = "";
  f_owner.value = "";
  f_category.value = "drawings";
  f_added.value = todayISO();
  f_notes.value = "";
}
toggleFormBtn.onclick = () => {
  if (addForm.style.display === "none" || !addForm.style.display) {
    clearForm(); addForm.style.display = "";
  } else addForm.style.display = "none";
};
cancelFormBtn.onclick = () => addForm.style.display = "none";

toggleCompletedBtn.onclick = () => {
  const hidden = (completedSection.style.display === "none" || !completedSection.style.display);
  if (hidden) {
    completedSection.style.display = "";
    toggleCompletedBtn.textContent = "Hide Completed";
    renderCompleted();
  } else {
    completedSection.style.display = "none";
    toggleCompletedBtn.textContent = "Show Completed";
  }
};
saveTaskBtn.onclick = async () => {
  const title = (f_title.value || "").trim();
  if (!title) return alert("Please enter a task title.");
  const task = {
    id: uid(),
    title,
    owner: (f_owner.value || "").trim(),
    category: f_category.value,
    added: f_added.value || todayISO(),
    notes: (f_notes.value || "").trim(),
    done: false,
    completed: ""
  };
  try {
    await addTask(task);
    addForm.style.display = "none";
    await loadAndRender();
  } catch (e) {
    alert("Could not save task. " + e.message);
  }
};

// Init
f_added.value = todayISO();
setInterval(loadAndRender, 15000); // auto-refresh for smartboard
loadAndRender();
