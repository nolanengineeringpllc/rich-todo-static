// API URL comes from config.js (loaded before this file)
const API_URL = window.API_URL;

// Four columns
const CATS = [
  "Drawings to Review",
  "Reports to Write",
  "Reports to Review",
  "Other",
];

// ---------- HTTP helpers (POST uses simple content-type to avoid preflight) ----------
async function apiGet() {
  const res = await fetch(API_URL);
  const raw = await res.text();
  let json;
  try { json = JSON.parse(raw); }
  catch (e) {
    console.error("GET parse error. Raw:", raw);
    throw new Error("Backend did not return valid JSON.");
  }
  if (!json.ok) {
    console.error("GET error payload:", json);
    throw new Error(json.error || "API error");
  }
  return json.data;
}

async function apiPost(body) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // <-- avoids CORS preflight
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  let json;
  try { json = JSON.parse(raw); }
  catch (e) {
    console.error("POST parse error. Raw:", raw);
    throw new Error("Backend did not return valid JSON.");
  }
  if (!json.ok) {
    console.error("POST error payload:", json);
    throw new Error(json.error || "API error");
  }
  return json.data;
}

// ---------- CRUD ----------
async function loadTasks() {
  try {
    const tasks = await apiGet();
    renderBoard(tasks);
  } catch (err) {
    console.error("Load error:", err);
    alert("Error loading tasks. See console for details.");
  }
}

async function addTask(title, owner, category, notes) {
  try {
    const id = (crypto?.randomUUID?.() || String(Date.now()));
    const added = new Date().toISOString().slice(0, 10);
    await apiPost({ action: "add", task: { id, title, owner, category, added, notes } });
    await loadTasks();
  } catch (err) {
    console.error("Add error:", err);
    alert("Could not add task. See console for details.");
  }
}

async function toggleTask(id) {
  try { await apiPost({ action: "toggle", id }); await loadTasks(); }
  catch (err) { console.error("Toggle error:", err); }
}

async function deleteTask(id) {
  if (!confirm("Delete this task?")) return;
  try { await apiPost({ action: "delete", id }); await loadTasks(); }
  catch (err) { console.error("Delete error:", err); }
}

// ---------- Render 4-column board ----------
function renderBoard(all) {
  const buckets = {
    "Drawings to Review": [],
    "Reports to Write":   [],
    "Reports to Review":  [],
    "Other":              [],
    completed:            [],
  };

  all.forEach((t) => {
    if (t.done) buckets.completed.push(t);
    else if (CATS.includes(t.category)) buckets[t.category].push(t);
    else buckets["Other"].push(t);
  });

  fillList("col-drawings", buckets["Drawings to Review"]);
  fillList("col-write",   buckets["Reports to Write"]);
  fillList("col-review",  buckets["Reports to Review"]);
  fillList("col-other",   buckets["Other"]);
  fillList("completed",   buckets.completed, true);
}

function fillList(id, items, completed = false) {
  const ul = document.getElementById(id);
  ul.innerHTML = "";
  if (!items.length) {
    const li = document.createElement("li");
    li.className = "meta";
    li.textContent = completed ? "No completed tasks." : "No tasks.";
    ul.appendChild(li);
    return;
  }

  for (const t of items) {
    const li = document.createElement("li");
    li.className = "cardlet";
    li.innerHTML = `
      <div>
        <div><strong>${escapeHtml(t.title)}</strong></div>
        <div class="meta">${escapeHtml(t.owner || "")} • ${escapeHtml(t.category || "")} • ${escapeHtml(t.added || "")}</div>
        ${t.notes ? `<div class="meta">${escapeHtml(t.notes)}</div>` : ""}
      </div>
      <div class="actions">
        <button class="btn" data-act="toggle">${t.done ? "Undo" : "Done"}</button>
        <button class="btn delete" data-act="delete">Delete</button>
      </div>
    `;
    li.querySelector('[data-act="toggle"]').onclick = () => toggleTask(t.id);
    li.querySelector('[data-act="delete"]').onclick = () => deleteTask(t.id);
    if (completed) li.classList.add("done");
    ul.appendChild(li);
  }
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[m]));
}

// ---------- DOM wiring ----------
document.addEventListener("DOMContentLoaded", () => {
  // Print
  document.getElementById("printBtn").addEventListener("click", () => window.print());

  // Backend check (GET + quick add/delete ping)
  document.getElementById("checkBtn").addEventListener("click", async () => {
    try {
      const data = await apiGet();
      alert("Backend GET ok. Current tasks: " + data.length);
    } catch (e) {
      console.error("Backend GET failed:", e);
      alert("Backend GET failed. See console.");
      return;
    }
    try {
      const tempId = (crypto?.randomUUID?.() || String(Date.now()));
      await apiPost({ action:"add", task:{
        id: tempId, title:"_ping_", owner:"check", category:"Other",
        added: new Date().toISOString().slice(0,10), notes:"diagnostic"
      }});
      await apiPost({ action:"delete", id: tempId });
      console.log("Backend POST ok.");
    } catch (e) {
      console.error("Backend POST failed:", e);
    }
  });

  // Chips set the hidden category input
  const catInput = document.getElementById("category");
  document.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      catInput.value = btn.dataset.cat;
    });
  });

  // Add form
  const form = document.getElementById("taskForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("title").value.trim();
    const owner = document.getElementById("owner").value.trim();
    const category = document.getElementById("category").value;
    const notes = document.getElementById("notes").value.trim();
    if (!title) return alert("Please enter a title.");
    addTask(title, owner, category, notes);
    form.reset();
    // reset chips to Other & hidden category
    document.querySelectorAll(".chip").forEach((b) => b.classList.remove("active"));
    document.querySelector('.chip[data-cat="Other"]').classList.add("active");
    catInput.value = "Other";
  });

  loadTasks();
});
