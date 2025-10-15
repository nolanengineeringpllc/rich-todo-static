// Shared To-Do App (with categories and timestamps)
const categories = ["Drawings to Review", "Reports to Write", "Reports to Review", "Other"];
const tasksContainer = document.getElementById("tasks");
const addBtn = document.getElementById("addBtn");
const showCompletedBtn = document.getElementById("showCompletedBtn");

const API_URL = "https://raw.githubusercontent.com/nolanengineeringpllc/rich-todo-static/main/api/tasks.json";
let tasks = [];
let showCompleted = false;

async function fetchTasks() {
  try {
    const res = await fetch(API_URL + "?t=" + new Date().getTime());
    tasks = await res.json();
    renderTasks();
  } catch (err) {
    console.error("Error fetching tasks:", err);
    tasks = [];
    renderTasks();
  }
}

function renderTasks() {
  tasksContainer.innerHTML = "";
  categories.forEach((category) => {
    const section = document.createElement("div");
    section.className = "category";
    section.innerHTML = `<h3>${category}</h3>`;
    const filtered = tasks.filter(t => t.category === category && t.done === showCompleted);
    if (filtered.length === 0) {
      const none = document.createElement("p");
      none.innerText = "No tasks yet.";
      section.appendChild(none);
    } else {
      filtered.forEach((task, i) => {
        const div = document.createElement("div");
        div.className = "task";
        div.innerHTML = `
          <strong>${task.title}</strong><br>
          <small>By: ${task.owner} | Added: ${task.dateAdded}</small>
          ${task.done ? `<br><small>Completed: ${task.dateCompleted}</small>` : ""}
          <button>${task.done ? "Undo" : "✔"}</button>
        `;
        div.querySelector("button").onclick = () => toggleTask(task);
        section.appendChild(div);
      });
    }
    tasksContainer.appendChild(section);
  });
}

async function toggleTask(task) {
  task.done = !task.done;
  task.dateCompleted = task.done ? new Date().toLocaleString() : null;
  await saveTasks();
  fetchTasks();
}

async function addTask() {
  const title = prompt("Task description:");
  if (!title) return;
  const category = prompt("Enter category (Drawings to Review, Reports to Write, Reports to Review, Other):");
  if (!categories.includes(category)) return alert("Invalid category.");
  const owner = prompt("Who is this for?");
  const task = {
    title,
    category,
    owner,
    done: false,
    dateAdded: new Date().toLocaleString(),
    dateCompleted: null,
  };
  tasks.push(task);
  await saveTasks();
  fetchTasks();
}

async function saveTasks() {
  // NOTE: This method cannot directly write to GitHub.
  // To make live edits, we’ll connect a small Vercel function next.
  console.log("Saving tasks locally for now.");
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

addBtn.onclick = addTask;
showCompletedBtn.onclick = () => {
  showCompleted = !showCompleted;
  showCompletedBtn.innerText = showCompleted ? "Show Active" : "Show Completed";
  renderTasks();
};

fetchTasks();
