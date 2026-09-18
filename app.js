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

    // 行を長押しすると並び替えを開始
    li.addEventListener("pointerdown", (e) => onItemPointerDown(e, li));

    li.append(check, text, del);
    listEl.appendChild(li);
  });
}

// ---- 長押しでドラッグ&ドロップ並び替え ----
// iOS Safari では pointermove の preventDefault ではスクロールを止められないため、
// ジェスチャ開始前から存在する passive:false の touchmove リスナーで抑止する。
const LONG_PRESS_MS = 450; // 長押し判定のミリ秒
const MOVE_TOLERANCE = 10; // これ以上動いたらスクロール/タップとみなし長押し中止
let dragEl = null;
let pressTimer = null;
let startX = 0;
let startY = 0;

function onItemPointerDown(e, li) {
  // チェック・削除ボタンのタップは邪魔しない。マウスは左ボタンのみ
  if (e.target.closest(".check, .del")) return;
  if (e.pointerType === "mouse" && e.button !== 0) return;
  startX = e.clientX;
  startY = e.clientY;
  // 長押しタイマー開始（指を止めたまま一定時間でドラッグ開始）
  clearTimeout(pressTimer);
  pressTimer = setTimeout(() => beginDrag(li), LONG_PRESS_MS);
  document.addEventListener("pointermove", onPreDragMove);
  document.addEventListener("pointerup", cancelPress);
  document.addEventListener("pointercancel", cancelPress);
}

// ドラッグ開始前：指が動いたら（＝スクロール意図）長押しを中止
function onPreDragMove(e) {
  if (Math.abs(e.clientX - startX) > MOVE_TOLERANCE ||
      Math.abs(e.clientY - startY) > MOVE_TOLERANCE) {
    cancelPress();
  }
}

function cancelPress() {
  clearTimeout(pressTimer);
  pressTimer = null;
  document.removeEventListener("pointermove", onPreDragMove);
  document.removeEventListener("pointerup", cancelPress);
  document.removeEventListener("pointercancel", cancelPress);
}

function beginDrag(li) {
  cancelPress();
  dragEl = li;
  li.classList.add("dragging");
  if (navigator.vibrate) { try { navigator.vibrate(15); } catch (_) {} }
  // ドラッグ終了の検知（タッチ・マウス両対応）
  document.addEventListener("pointerup", endDrag);
  document.addEventListener("pointercancel", endDrag);
  document.addEventListener("touchend", endDrag);
  document.addEventListener("touchcancel", endDrag);
}

// タッチの移動：ドラッグ中はスクロールを止めて並び替え（iOS対応の要）
function onGlobalTouchMove(e) {
  if (!dragEl) return; // ドラッグ中でなければ通常スクロールを許可
  e.preventDefault();
  moveDragTo(e.touches[0].clientY);
}

// マウスの移動：ドラッグ中に並び替え（デスクトップ用）
function onGlobalPointerMove(e) {
  if (!dragEl || e.pointerType !== "mouse") return;
  moveDragTo(e.clientY);
}

function moveDragTo(y) {
  const after = getDropTarget(y);
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
  document.removeEventListener("pointerup", endDrag);
  document.removeEventListener("pointercancel", endDrag);
  document.removeEventListener("touchend", endDrag);
  document.removeEventListener("touchcancel", endDrag);
  dragEl.classList.remove("dragging");
  dragEl = null;
  // 画面上の並び順に合わせて items を作り直して保存
  const order = [...listEl.querySelectorAll("li")].map((li) => li.dataset.id);
  items.sort((a, b) => order.indexOf(String(a.id)) - order.indexOf(String(b.id)));
  save();
  // ドロップ直後に発火する擬似クリック（チェック等の誤爆）を1回だけ無効化
  const killClick = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
  document.addEventListener("click", killClick, true);
  setTimeout(() => document.removeEventListener("click", killClick, true), 350);
}

// スクロール抑止リスナーはジェスチャ開始前から常設しておく（iOSで必須）
document.addEventListener("touchmove", onGlobalTouchMove, { passive: false });
document.addEventListener("pointermove", onGlobalPointerMove);

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
