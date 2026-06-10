let todos = JSON.parse(localStorage.getItem("focus-todos")) || [];
let filter = "all";

const input = document.getElementById("todoInput");
const addBtn = document.getElementById("addBtn");
const list = document.getElementById("todoList");
const bar = document.getElementById("progressBar");
const pText = document.getElementById("progressText");
const pPct = document.getElementById("progressPct");
const toastEl = document.getElementById("toast");

function save() {
  localStorage.setItem("focus-todos", JSON.stringify(todos));
}

let toastTimer = null;
function showToast(msg, type) {
  clearTimeout(toastTimer);
  toastEl.textContent = msg;
  toastEl.classList.toggle("error", type === "error");
  toastEl.classList.add("show");
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
}

function updateProgress() {
  const total = todos.length;
  const done = todos.filter((t) => t.completed).length;
  if (total === 0) {
    bar.style.width = "0%";
    pText.textContent = "No tasks yet";
    pPct.textContent = "—";
  } else {
    const pct = Math.round((done / total) * 100);
    bar.style.width = pct + "%";
    pText.textContent = done + " of " + total + " completed";
    pPct.textContent = pct + "%";
  }
}

function getFiltered() {
  if (filter === "active") return todos.filter((t) => !t.completed);
  if (filter === "completed") return todos.filter((t) => t.completed);
  return todos;
}

function render() {
  updateProgress();
  const filtered = getFiltered();
  if (filtered.length === 0) {
    list.innerHTML = `
          <div class="empty-state">
            <div class="empty-illustration">
              <svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            </div>
            <strong>${filter === "completed" ? "Nothing done yet" : "All clear!"}</strong>
            <p>${filter === "all" ? "Add a task above to get started." : filter === "active" ? "No active tasks right now." : "Complete a task and it appears here."}</p>
          </div>`;
    return;
  }

  list.innerHTML = "";
  filtered.forEach((todo) => {
    const realIdx = todos.indexOf(todo);
    const item = document.createElement("div");
    item.className = "todo-item" + (todo.completed ? " completed" : "");

    item.innerHTML = `
          <button class="check-wrap ${todo.completed ? "done" : ""}" aria-label="${todo.completed ? "Mark incomplete" : "Mark complete"}">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
          <span class="todo-text">${escHtml(todo.text)}</span>
          <div class="todo-actions">
            <button class="action-btn edit-btn" aria-label="Edit task">
              <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="action-btn delete-btn" aria-label="Delete task">
              <svg viewBox="0 0 24 24" stroke="currentColor"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>`;

    item.querySelector(".check-wrap").onclick = () => toggleTodo(realIdx);
    item.querySelector(".todo-text").onclick = () => toggleTodo(realIdx);
    item.querySelector(".edit-btn").onclick = () => startEdit(item, realIdx);
    item.querySelector(".delete-btn").onclick = () => deleteTodo(realIdx);

    list.appendChild(item);
  });
}

function escHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function startEdit(item, idx) {
  if (item.classList.contains("editing")) return;
  item.classList.add("editing");

  const textEl = item.querySelector(".todo-text");
  const actionsEl = item.querySelector(".todo-actions");
  const currentText = todos[idx].text;

  textEl.replaceWith(
    Object.assign(document.createElement("input"), {
      type: "text",
      className: "edit-input",
      value: currentText,
      id: "edit-input-" + idx,
    }),
  );

  const editInput = item.querySelector(".edit-input");

  const saveBtn = document.createElement("button");
  saveBtn.className = "save-btn";
  saveBtn.setAttribute("aria-label", "Save edit");
  saveBtn.innerHTML =
    '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';
  actionsEl.prepend(saveBtn);

  item.querySelector(".edit-btn").style.display = "none";

  editInput.focus();
  editInput.setSelectionRange(editInput.value.length, editInput.value.length);

  function doSave() {
    const newText = editInput.value.trim();
    if (!newText) {
      showToast("Task cannot be empty!", "error");
      editInput.focus();
      return;
    }
    todos[idx].text = newText;
    save();
    render();
    showToast("Task updated ✓");
  }

  saveBtn.onclick = doSave;
  editInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doSave();
    if (e.key === "Escape") render();
  });
}

function addTodo() {
  const text = input.value.trim();
  if (!text) {
    showToast("Please enter a task first!", "error");
    input.focus();
    input.classList.add("shake");
    setTimeout(() => input.classList.remove("shake"), 400);
    return;
  }
  todos.push({ text, completed: false, id: Date.now() });
  save();
  input.value = "";
  render();
  showToast("Task added ✓");
}

function toggleTodo(idx) {
  todos[idx].completed = !todos[idx].completed;
  save();
  render();
  if (todos[idx].completed) showToast("Nice work! Task done ✓");
}

function deleteTodo(idx) {
  todos.splice(idx, 1);
  save();
  render();
  showToast("Task removed");
}

addBtn.onclick = addTodo;
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTodo();
});

document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.onclick = () => {
    filter = btn.dataset.filter;
    document
      .querySelectorAll(".filter-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    render();
  };
});

render();
