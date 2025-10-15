// Rich's To-Do (Sections)
// Stores data in localStorage

const STORAGE_KEY = "tasks_sections_v1";

const todayISO = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// --- DOM
const toggleFormBtn = document.getElementById("toggleFormBtn");
const toggleCompletedBtn = document.getElementById("toggleCompletedBtn");
const addForm = document.getElementById("addForm");
const completedSection = document.getElementById("completedSection");

const listEls = {
  drawings: document.getElementById("list_drawings"),
  write: document.getElementById("list_write"),
  review: document.getElementById("list_review"),
  other: document.getElementById("list_other"),
  completed: document.getElementById("list_completed"),
};

// Form fields
const f_title = document.getElementById("f_title");
const f_owner = document.getElementById("f_owner");
const f_category = document.getElementById("f_category");
const f_added = document.getElementById("f_added");
const f_notes = document.getElementById("f_notes");
const saveTaskBtn = document.getElementById("saveTaskBtn");
const cancelFormBtn = document.getElementById("cancelFormBtn");

// --- Data
function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
let tasks = load();

// --- UI helpers
function show(el) { el.style.display = ""; }
function hide(el) { el.style.display = "none"; }

function clearForm() {
  f_title.value = "";
  f_owner.value = "";
  f_category.value = "drawings";
  f_added.value = todayISO();
  f_notes.value = "";
}

// Render one open (not done) list by category
function renderOpenList(category) {
  const el = listEls[category];
  el.innerHTML = "";
  const filtered = tasks
    .filter(t => !t.done && t.category === category)
    .sort((a,b) => (a.added || "").localeCompare(b.added || ""));

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "task";
    empty.style.opacity = ".6";
    empty.textContent = "No tasks yet.";
    el.appendChild(empty);
    return;
  }

  for (const t of filtered) {
    const row = document.createElement("div");
    row.className = "task";
    row.innerHTML = `
      <div>
        <div style="font-weight:600">${t.title}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px">
          <b>Owner:</b> ${t.owner || "—"} &nbsp;•&nbsp;
          <b>Added:</b> ${t.added || "—"}
          ${t.notes ? `&nbsp;•&nbsp;<b>Notes:</b> ${t.notes}` : ""}
        </div>
      </div>
      <div>
        <button class="btn" data-action="done">✔</button>
        <button class="btn" data-action="delete" style="margin-left:6px;background:#ef4444">🗑</button>
      </div>
    `;
    row.querySelector('[data-action="done"]').onclick = () => {
      t.done = true;
      t.completed = todayISO();
      save(tasks); renderAll();
    };
    row.querySelector('[data-action="delete"]').onclick = () => {
      if (confirm("Delete this task?")) {
        tasks = tasks.filter(x => x.id !== t.id);
        save(tasks); renderAll();
      }
    };
    el.appendChild(row);
  }
}

// Render completed list
function renderCompletedList() {
  const el = listEls.completed;
  el.innerHTML = "";
  const filtered = tasks
    .filter(t => t.done)
    .sort((a,b) => (b.completed || "").localeCompare(a.completed || ""));

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "task";
    empty.style.opacity = ".6";
    empty.textContent = "No completed tasks yet.";
    el.appendChild(empty);
    return;
  }

  for (const t of filtered) {
    const row = document.createElement("div");
    row.className = "task done";
    row.innerHTML = `
      <div>
        <div style="font-weight:600">${t.title}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px">
          <b>Owner:</b> ${t.owner || "—"} &nbsp;•&nbsp;
          <b>Category:</b> ${labelForCategory(t.category)} &nbsp;•&nbsp;
          <b>Added:</b> ${t.added || "—"} &nbsp;•&nbsp;
          <b>Completed:</b> ${t.completed || "—"}
          ${t.notes ? `&nbsp;•&nbsp;<b>Notes:</b> ${t.notes}` : ""}
        </div>
      </div>
    `;
    el.appendChild(row);
  }
}

function labelForCategory(val) {
  return ({
    drawings: "Drawings to Review",
    write: "Reports to Write",
    review: "Reports to Review",
    other: "Other",
  })[val] || val;
}

function renderAll() {
  renderOpenList("drawings");
  renderOpenList("write");
  renderOpenList("review");
  renderOpenList("other");
  if (completedSection.style.display !== "none") {
    renderCompletedList();
  }
}

// --- Events
toggleFormBtn.onclick = () => {
  if (addForm.style.display === "none" || addForm.style.display === "") {
    clearForm();
    show(addForm);
  } else {
    hide(addForm);
  }
};

toggleCompletedBtn.onclick = () => {
  const isHidden = completedSection.style.display === "none" || completedSection.style.display === "";
  if (isHidden) {
    show(completedSection);
    toggleCompletedBtn.textContent = "Hide Completed";
    renderCompletedList();
  } else {
    hide(completedSection);
    toggleCompletedBtn.textContent = "Show Completed";
  }
};

cancelFormBtn.onclick = () => hide(addForm);

saveTaskBtn.onclick = () => {
  const title = (f_title.value || "").trim();
  if (!title) {
    alert("Please enter a task title.");
    return;
  }
  const task = {
    id: uid(),
    title,
    owner: (f_owner.value || "").trim(),
    category: f_category.value,
    added: f_added.value || todayISO(),
    notes: (f_notes.value || "").trim(),
    done: false,
    completed: "",
  };
  tasks.unshift(task);         // newest first
  save(tasks);
  hide(addForm);
  renderAll();
};

// Initialize defaults and first render
if (!f_added.value) f_added.value = todayISO();
renderAll();