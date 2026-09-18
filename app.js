// ---- データ保存（端末内 localStorage）----
const KEY = "todo-items-v1";
let items = [];

try {
  items = JSON.parse(localStorage.getItem(KEY)) || [];
} catch (e) {
  items = [];
}

const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const formEl = document.getElementById("form");
const inputEl = document.getElementById("input");

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch (e) {
    /* プライベートモード等では保存できない場合がある */
  }
}

function render() {
  listEl.innerHTML = "";
  emptyEl.hidden = items.length > 0;

  items.forEach((item) => {
    const li = document.createElement("li");
    if (item.done) li.classList.add("done");

    const check = document.createElement("div");
    check.className = "check";
    check.textContent = item.done ? "✓" : "";
    check.onclick = () => {
      item.done = !item.done;
      save();
      render();
    };

    const text = document.createElement("span");
    text.className = "text";
    text.textContent = item.text;

    const del = document.createElement("button");
    del.className = "del";
    del.textContent = "✕";
    del.setAttribute("aria-label", "削除");
    del.onclick = () => {
      items = items.filter((x) => x.id !== item.id);
      save();
      render();
    };

    li.append(check, text, del);
    listEl.appendChild(li);
  });
}

formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = inputEl.value.trim();
  if (!value) return;
  items.unshift({ id: Date.now(), text: value, done: false });
  inputEl.value = "";
  save();
  render();
});

render();

// ---- Service Worker 登録（オフライン対応）----
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.warn("Service Worker 登録失敗:", err);
    });
  });
}

// ---- オンライン/オフライン状態表示 ----
const statusEl = document.getElementById("status");
function updateStatus() {
  statusEl.textContent = navigator.onLine
    ? "オフラインでも動きます"
    : "オフライン中（保存済みデータで動作中）";
}
window.addEventListener("online", updateStatus);
window.addEventListener("offline", updateStatus);
updateStatus();

// ---- iOS Safari 用インストール案内 ----
// standalone（ホーム画面から起動）でなく、iOSっぽい端末のときだけ表示
const tip = document.getElementById("installTip");
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone =
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

if (isIOS && !isStandalone && !localStorage.getItem("tip-closed")) {
  tip.hidden = false;
  document.getElementById("closeTip").onclick = () => {
    tip.hidden = true;
    try { localStorage.setItem("tip-closed", "1"); } catch (e) {}
  };
}
