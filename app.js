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
    li.dataset.id = item.id;
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

    // 並び替え用ドラッグハンドル
    const handle = document.createElement("div");
    handle.className = "handle";
    handle.textContent = "⠿";
    handle.setAttribute("aria-label", "ドラッグして並び替え");
    handle.addEventListener("pointerdown", (e) => startDrag(e, li));

    li.append(handle, check, text, del);
    listEl.appendChild(li);
  });
}

// ---- ドラッグ&ドロップ並び替え（Pointer Events：iOSタッチ対応）----
let dragEl = null;

function startDrag(e, li) {
  e.preventDefault();
  dragEl = li;
  li.classList.add("dragging");
  // ハンドルでポインタを掴み続ける（指が多少ずれても追従）
  try { e.target.setPointerCapture(e.pointerId); } catch (_) {}
  // 終了処理が確実に走るよう document で購読（要素外で離しても検知）
  document.addEventListener("pointermove", onDragMove);
  document.addEventListener("pointerup", endDrag);
  document.addEventListener("pointercancel", endDrag);
}

function onDragMove(e) {
  if (!dragEl) return;
  const after = getDropTarget(e.clientY);
  if (after == null) {
    listEl.appendChild(dragEl);
  } else if (after !== dragEl) {
    listEl.insertBefore(dragEl, after);
  }
}

// ポインタ位置より下にある最初の項目を返す（そこの前に挿入する）
function getDropTarget(y) {
  const others = [...listEl.querySelectorAll("li:not(.dragging)")];
  for (const el of others) {
    const box = el.getBoundingClientRect();
    if (y < box.top + box.height / 2) return el;
  }
  return null; // 一番下
}

function endDrag() {
  if (!dragEl) return;
  document.removeEventListener("pointermove", onDragMove);
  document.removeEventListener("pointerup", endDrag);
  document.removeEventListener("pointercancel", endDrag);
  dragEl.classList.remove("dragging");
  dragEl = null;
  // 画面上の並び順に合わせて items を作り直して保存
  const order = [...listEl.querySelectorAll("li")].map((li) => li.dataset.id);
  items.sort((a, b) => order.indexOf(String(a.id)) - order.indexOf(String(b.id)));
  save();
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
