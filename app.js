// Rich's Shared To-Do App (Live Google Sheets Backend)
const categories = ["Drawings to Review", "Reports to Write", "Reports to Review", "Other"];
const taskContainer = document.getElementById("tasks");
const addBtn = document.getElementById("addBtn");
const showCompletedBtn = document.getElementById("showCompletedBtn");

const API_URL = "https://script.google.com/macros/s/AKfycbx06bRQdwGsVW_g02JoIz-oTrfhysW6kyvdejwklNLhZbFgYo-SjoedPww/exec";

let tasks = [];
let showCompleted = false;

// Fetch tasks from Google Sheets backend
async function fetchTasks() {
  try {
    const res = await fetch(API_URL + "?v=" + new Date().getTime());
    tasks = await res.json();
    renderTasks();
  } catch (err) {
    console.error("Error fetching tasks:", err);
    tasks = [];
    renderTasks();
  }
}

// Render tasks into categories
function renderTasks() {
  taskContainer.innerHTML = "";
  categories.forEach(category => {
    const section = document.createElement("div");
    section.className = "category";
    section.innerHTML = `<h3>${category}</h3>`;

    const filtered = tasks.filter(t => t.category === category && (showCompleted || !t.done));
    if (filtered.length === 0) {
      section.innerHTML += `<p class="empty">No tasks yet.</p>`;
    } else {
      filtered.forEach((t, i) => {
        const div = document.createElement("div");
        div.className = "task" + (t.done ? " done" : "");
        div.innerHTML = `
          <div>
            <strong>${t.title}</strong> — <em>${t.owner}</em><br>
            <small>Added: ${t.added}${t.done ? " | Completed: " + t.completed : ""}</small>
            ${t.notes ? `<p>${t.notes}</p>` : ""}
          </div>
          <button>${t.done ? "Undo" : "Done"}</button>
        `;
        div.querySelector("button").onclick = () => toggleDone(i);
        section.appendChild(div);
      });
    }

    taskContainer.appendChild(section);
  });
}

// Add new task
addBtn.onclick = async () => {
  const title = prompt("Task description:");
  if (!title) return;

  const owner = prompt("Who is this for?");
  const category = prompt("Category (Drawings to Review, Reports to Write, Reports to Review, Other):");
  const notes = prompt("Additional notes (optional):");
  const added = new Date().toLocaleDateString();

  const task = { title, owner, category, added, notes, done: false, completed: "" };

  try {
    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(task),
      headers: { "Content-Type": "application/json" }
    });
    await fetchTasks();
  } catch (err) {
    console.error("Error adding task:", err);
  }
};

// Toggle completion
async function toggleDone(index) {
  const task = tasks[index];
  task.done = !task.done;
  task.completed = task.done ? new Date().toLocaleDateString() : "";

  try {
    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(task),
      headers: { "Content-Type": "application/json" }
    });
    await fetchTasks();
  } catch (err) {
    console.error("Error updating task:", err);
  }
}

// Toggle completed visibility
showCompletedBtn.onclick = () => {
  showCompleted = !showCompleted;
  showCompletedBtn.textContent = showCompleted ? "Hide Completed" : "Show Completed";
  renderTasks();
};

// Initialize
fetchTasks();

