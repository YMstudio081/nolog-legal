/* NOLOG 受け取りページ。CSP で inline script を禁止するため別ファイル。 */
(function () {
  "use strict";
  var ja = (navigator.language || "ja").toLowerCase().indexOf("ja") === 0;
  document.documentElement.lang = ja ? "ja" : "en";
  if (!ja) document.title = "NOLOG — Invite";
  var T = ja ? {
    lead: "あなた宛ての秘密が<br>ひとつ届いています。", leadSub: "一度だけ読めて、読んだら消えます。",
    viaApp: "アプリで受け取る", viaWeb: "ブラウザで受け取る",
    choiceNote: "アプリなら、スクリーンショットを防ぎ<br>なりすましを確かめられます。<br><b>ブラウザでは防げません。</b>",
    store: "アプリをお持ちでない方は App Store へ",
    footBase: "アカウント登録なし · 連絡先の交換なし",
    footWeb: "ブラウザで受け取り中 · スクリーンショットは防げません",
    connecting: "暗号鍵を交換しています", waiting: "まもなく届きます",
    keepOpen: "この画面は閉じないでください。<br>暗号化はこの端末の中だけで行います。",
    hold: "長押しで封を切る",
    holdNote: "指を離した瞬間、この手紙は<br>あなたの画面からも<br>送った人の画面からも消えます。",
    release: "指を離すと消えます",
    doneT: "受け取りました。", doneD: "この手紙は、あなたの画面からも<br>送った人の画面からも消えました。<br>何も残っていません。",
    alsoSend: "自分も NOLOG で渡す",
    goneT: "この手紙は、もうありません。", goneD: "期限が切れたか、すでに受け取られたか、<br>送った人が取り消しました。",
    hostAwayT: "送った人の画面が閉じています。", hostAwayD: "送った人が NOLOG を開くと届きます。<br>このまま少しお待ちください。",
    chatT: "これは会話への招待です。", chatD: "会話は NOLOG アプリで行えます。",
    openApp: "アプリで開く",
    netT: "つながりませんでした。", netD: "通信状態を確かめて、もう一度お試しください。", retry: "もう一度",
    badT: "招待コードが見つかりません。", badD: "送られてきたリンクを、もう一度確かめてください。",
    burnedBg: "画面を離れたため、手紙を消しました。",
    goneHint: "心当たりがない場合は、送った人に知らせてください。",
    appHint: "アプリが開かない場合は、App Store から入手してください。"
  } : {
    lead: "A secret has arrived<br>for you.", leadSub: "Readable once. Gone once read.",
    viaApp: "Open in the app", viaWeb: "Open in this browser",
    choiceNote: "The app blocks screenshots<br>and lets you verify the sender.<br><b>A browser cannot block screenshots.</b>",
    store: "Don't have the app? Get it on the App Store",
    footBase: "No account · No contacts exchanged",
    footWeb: "Receiving in browser · Screenshots cannot be blocked",
    connecting: "Exchanging encryption keys", waiting: "Arriving shortly",
    keepOpen: "Please keep this page open.<br>Encryption happens only on this device.",
    hold: "Hold to break the seal",
    holdNote: "The moment you let go, this letter vanishes<br>from your screen and the sender's.",
    release: "Let go and it's gone",
    doneT: "Received.", doneD: "This letter has vanished from your screen<br>and the sender's. Nothing remains.",
    alsoSend: "Hand over a secret with NOLOG",
    goneT: "This letter is no longer here.", goneD: "It expired, was already received,<br>or the sender cancelled it.",
    hostAwayT: "The sender's screen is closed.", hostAwayD: "It will arrive when they reopen NOLOG.<br>Please wait a moment.",
    chatT: "This is an invitation to a conversation.", chatD: "Conversations take place in the NOLOG app.",
    openApp: "Open in the app",
    netT: "Couldn't connect.", netD: "Check your connection and try again.", retry: "Try again",
    badT: "No invite code found.", badD: "Please check the link you received.",
    burnedBg: "You left the page, so the letter was erased.",
    goneHint: "If you didn't open it, please let the sender know.",
    appHint: "If the app doesn't open, get it from the App Store."
  };

  var STORE = "https://apps.apple.com/app/id6759816705";
  var RELAY = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? "ws://localhost:3001" : "wss://nolog-server.onrender.com";
  var MAGIC = "\u0001NL1:";
  var view = document.getElementById("view"), foot = document.getElementById("foot");

  // コードは # 以降のみから読む（クエリは見ない）。英数字とハイフン以外は受け付けない。
  var code = "";
  try { code = decodeURIComponent((location.hash || "").slice(1)); } catch (e) { code = ""; }
  if (!/^[A-Za-z0-9-]{8,64}$/.test(code)) code = "";
  // 注: # 以降は再読み込みで必要になるので消さない（コードは一回きりのルームIDで、本文・鍵は含まない）

  function render(html, footText) { view.innerHTML = html; foot.textContent = footText || T.footBase; }
  function env(inner, tall) { return '<div class="env' + (tall ? ' tall' : '') + '">' + inner + '</div>'; }
  var wax = '<div class="wax"><span class="serif">N</span></div>';

  // ── 画面 ───────────────────────────────
  function showChoose() {
    render(env(wax +
      '<div class="lead serif">' + T.lead + '<small>' + T.leadSub + '</small></div>' +
      '<div class="opts"><a class="btn dark" id="app" href="nolog://join/' + encodeURIComponent(code) + '">' + T.viaApp + '</a>' +
      '<button class="btn line" id="web" type="button">' + T.viaWeb + '</button></div>' +
      '<div class="note">' + T.choiceNote + '</div>') +
      '<a class="store" href="' + STORE + '" rel="noopener">' + T.store + '</a>');
    document.getElementById("web").addEventListener("click", startWeb);
    // アプリが入っていないと nolog:// は開けない。ページに留まっていたら App Store を案内する
    document.getElementById("app").addEventListener("click", function () {
      setTimeout(function () {
        if (document.hidden) return;
        var n = view.querySelector(".note"); if (n) n.innerHTML = '<b>' + T.appHint + '</b>';
      }, 1500);
    });
  }
  function showMessage(title, desc, actions) {
    render(env('<div class="t serif">' + title + '</div><div class="rule"></div><div class="d">' + desc + '</div>', true) +
      (actions || ''), T.footBase);
  }
  function showConnecting() {
    render(env('<div class="wax dim"><span class="serif">N</span></div>' +
      '<div class="status"><div class="spin"></div>' + T.connecting + '</div>' +
      '<div class="note">' + T.keepOpen + '</div>', true), T.footWeb);
  }

  // ── 暗号 ───────────────────────────────
  function b64(u8) { var s = ""; for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s); }
  function unb64(s) { var bin = atob(s), u8 = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return u8; }
  function decrypt(boxB64, key) {
    try {
      var all = unb64(boxB64), n = nacl.box.nonceLength;
      var opened = nacl.box.open.after(all.subarray(n), all.subarray(0, n), key);
      return opened ? new TextDecoder().decode(opened) : null;
    } catch (e) { return null; }
  }
  function openEnvelope(plain) {
    if (plain.indexOf(MAGIC) !== 0) return { kind: "text", text: plain };
    try { var o = JSON.parse(plain.slice(MAGIC.length)); return { kind: o.k === "s" ? "secret" : "text", text: String(o.t || "") }; }
    catch (e) { return { kind: "text", text: "" }; }
  }

  // ── ブラウザで受け取る ─────────────────────
  var ws = null, kp = null, shared = null, secret = null, secretId = null, done = false;
  var pingTimer = null, waitTimer = null, revealTimer = null, revealed = false;
  var activePointer = null, retries = 0, hostKey = null;

  function send(o) { try { if (ws && ws.readyState === 1) { ws.send(JSON.stringify(o)); return true; } } catch (e) {} return false; }
  function wipe() {
    // 鍵と本文をメモリから消す
    if (kp) { kp.secretKey.fill(0); kp = null; }
    if (shared) { shared.fill(0); shared = null; }
    secret = null;
    clearInterval(pingTimer); clearTimeout(waitTimer); clearTimeout(revealTimer);
  }
  function finish(kind) {
    if (done) return; done = true;
    wipe();
    try { ws && ws.close(); } catch (e) {}
    if (kind === "done") {
      render(env('<div class="t serif">' + T.doneT + '</div><div class="rule"></div><div class="d">' + T.doneD + '</div>', true) +
        '<div class="opts" style="margin-top:28px"><a class="btn line" href="' + STORE + '" rel="noopener">' + T.alsoSend + '</a></div>', T.footBase);
    } else if (kind === "gone") {
      showMessage(T.goneT, T.goneD + '<br><br>' + T.goneHint, '<a class="store" href="' + STORE + '" rel="noopener">' + T.store + '</a>');
    } else if (kind === "chat") {
      showMessage(T.chatT, T.chatD, '<div class="opts" style="margin-top:28px"><a class="btn dark" href="nolog://join/' + encodeURIComponent(code) + '">' + T.openApp + '</a></div>' +
        '<a class="store" href="' + STORE + '" rel="noopener">' + T.store + '</a>');
    } else if (kind === "net") {
      showMessage(T.netT, T.netD, '<div class="opts" style="margin-top:28px"><button class="btn line" id="again" type="button">' + T.retry + '</button></div>');
      document.getElementById("again").addEventListener("click", function () { done = false; startWeb(); });
    } else if (kind === "bg") {
      showMessage(T.doneT, T.burnedBg + '<br>' + T.doneD, '');
    }
  }

  function burn(reason) {
    if (!secretId || done) return;
    var msg = { type: "secretBurned", roomId: code, messageId: secretId, reason: reason };
    secretId = null;
    // 先に画面から消す（通信の成否に関係なく、本文は二度と表示しない）
    finish(reason === "viewed" ? "done" : "bg");
    if (!send(msg)) notifyLater(msg);
  }
  // 接続が切れていても、開封済みであることを相手に必ず伝える（つなぎ直して送る）
  function notifyLater(msg) {
    var tries = 0;
    (function attempt() {
      if (tries++ >= 3) return;
      var w; try { w = new WebSocket(RELAY); } catch (e) { return; }
      w.onopen = function () { try { w.send(JSON.stringify({ type: "join", roomId: code })); w.send(JSON.stringify(msg)); } catch (e) {} setTimeout(function () { try { w.close(); } catch (e) {} }, 800); };
      w.onerror = function () { setTimeout(attempt, 1500); };
    })();
  }

  function showSealed() {
    render(env('<button class="wax" id="seal" type="button" aria-label="' + T.hold + '"><span class="serif">N</span></button>' +
      '<div class="hold">' + T.hold + '</div><div class="note">' + T.holdNote + '</div>', true), T.footWeb);
    var seal = document.getElementById("seal");
    // 指は 1 本だけ扱う。2 本目は無視（離した後に表示が残る経路を作らない）
    var start = function (e) {
      e.preventDefault();
      if (revealed || activePointer !== null) return;
      activePointer = e.pointerId;
      seal.classList.add("pressing");
      clearTimeout(revealTimer);
      revealTimer = setTimeout(function () { if (activePointer !== null) reveal(); }, 250);
      try { seal.setPointerCapture(e.pointerId); } catch (x) {}
    };
    var end = function (e) {
      if (e && e.pointerId !== undefined && activePointer !== null && e.pointerId !== activePointer) return;
      activePointer = null;
      clearTimeout(revealTimer);
      seal.classList.remove("pressing");
      if (revealed) burn("viewed");
    };
    seal.addEventListener("pointerdown", start);
    seal.addEventListener("pointerup", end);
    seal.addEventListener("pointercancel", end);
    seal.addEventListener("lostpointercapture", end);
    // iOS の長押し（文字選択・ルーペ・メニュー）を止める
    seal.addEventListener("touchstart", function (e) { e.preventDefault(); }, { passive: false });
    seal.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  }
  function reveal() {
    if (!secret) return;
    revealed = true;
    // 封蝋（押している要素）は残したまま、その上に本文を出す。指を離せば pointerup で消える
    var envEl = view.querySelector(".env");
    var holder = document.createElement("div");
    holder.className = "secret serif";
    holder.textContent = secret;               // テキストとして入れる（HTML として解釈しない）
    var rel = document.createElement("div");
    rel.className = "note"; rel.style.color = "var(--gold-ink)"; rel.textContent = T.release;
    var hold = envEl.querySelector(".hold"), note = envEl.querySelector(".note");
    if (hold) hold.remove(); if (note) note.remove();
    envEl.querySelector(".wax").style.width = "40px"; envEl.querySelector(".wax").style.height = "40px";
    envEl.appendChild(Object.assign(document.createElement("div"), { className: "rule" }));
    envEl.appendChild(holder); envEl.appendChild(rel);
  }

  function startWeb() {
    if (typeof nacl === "undefined") { finish("net"); return; }
    showConnecting();
    if (kp) { kp.secretKey.fill(0); }
    kp = nacl.box.keyPair(); shared = null; hostKey = null;
    try { ws = new WebSocket(RELAY); } catch (e) { finish("net"); return; }
    var opened = false;
    ws.onopen = function () {
      opened = true;
      send({ type: "join", roomId: code });
      send({ type: "publicKey", roomId: code, key: b64(kp.publicKey) });
      pingTimer = setInterval(function () { send({ type: "ping", roomId: code, ts: Date.now() }); }, 20000);
      // 鍵交換のあと一定時間届かなければ、送った人の画面が閉じている可能性を伝える（待ち続ける）
      waitTimer = setTimeout(function () { if (!secret && !done) showMessage(T.hostAwayT, T.hostAwayD, '<div class="status"><div class="spin"></div>' + T.waiting + '</div>'); }, 20000);
    };
    ws.onerror = function () { /* onclose で扱う */ };
    ws.onclose = function () {
      clearInterval(pingTimer); clearTimeout(waitTimer);
      if (done || secret) return; // 受け取った後の切断は、開封時に notifyLater で伝える
      // まだ届いていない：通信が一瞬切れただけかもしれないので、数回つなぎ直す
      if (retries++ < 3) { setTimeout(startWeb, 1500 * retries); return; }
      finish(opened ? "gone" : "net");
    };
    ws.onmessage = function (ev) {
      var data; try { data = JSON.parse(ev.data); } catch (e) { return; }
      switch (data.type) {
        case "roomNotFound": case "roomFull": case "roomDestroyed": case "destroy":
          if (secret && revealed) return; // 読んでいる最中は、離した時点で終える
          finish("gone"); return;
        case "publicKey":
          if (!data.key || typeof data.key !== "string") return;
          if (data.key === b64(kp.publicKey)) return;
          if (data.key === hostKey) return;
          if (secret) return; // 受け取った後に鍵が変わっても、もう何も受け取らない
          // 送り手が入り直して鍵が変わった場合は、受け取り前なら新しい鍵でやり直す
          if (shared) shared.fill(0);
          try { shared = nacl.box.before(unb64(data.key), kp.secretKey); hostKey = data.key; } catch (e) { finish("net"); return; }
          retries = 0;
          // ブラウザで受け取ることを相手のアプリに伝える（相手の画面に「スクショは防げません」と出る）
          send({ type: "caps", roomId: code, v: 1, features: ["envelope", "secret"], client: "web" });
          render(env('<div class="wax dim"><span class="serif">N</span></div><div class="status"><div class="spin"></div>' + T.waiting + '</div><div class="note">' + T.keepOpen + '</div>', true), T.footWeb);
          return;
        case "message":
          if (!shared || secret) return;
          if (typeof data.id !== "string" || !data.id || typeof data.text !== "string") return;
          var plain = decrypt(data.text, shared);
          if (plain === null) return;
          var envl = openEnvelope(plain);
          if (envl.kind !== "secret") { finish("chat"); return; } // 会話への招待はアプリへ
          clearTimeout(waitTimer);
          secret = envl.text; secretId = data.id;
          showSealed();
          return;
        default: return;
      }
    };
  }

  // 封を切っている途中で画面を離れたら、その場で消す（タブ切替・アプリ切替・閉じる）
  document.addEventListener("visibilitychange", function () { if (document.hidden && revealed) burn("background"); });
  window.addEventListener("pagehide", function () {
    if (revealed) { burn("background"); return; }
    wipe();
    try { ws && ws.close(); } catch (e) {}
  });
  // 戻る操作でキャッシュから復元された場合は、壊れた状態を残さず最初から
  window.addEventListener("pageshow", function (e) { if (e.persisted) location.reload(); });
  window.addEventListener("blur", function () { if (revealed) burn("background"); });

  if (!code) { showMessage(T.badT, T.badD, '<a class="store" href="' + STORE + '" rel="noopener">' + T.store + '</a>'); }
  else { showChoose(); }
})();
