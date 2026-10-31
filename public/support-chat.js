/* FlagRisk website support chat. A polished, self-contained chat widget: a
   launcher that opens a panel where a visitor gives their name and an email or
   phone, then chats. The chat is a guest ticket in the support queue, guarded
   by a per-chat token kept in this browser. Replies come from the admin console
   and arrive here by polling. Include with:
   <script defer src="/support-chat.js"></script> */
(function () {
  if (window.__frChat) return;
  window.__frChat = true;

  var KEY = "fr_chat";
  var POLL_MS = 6000;
  var LOGO = "/img/logo.png";
  var session = null; // { ticket, token, name }
  try { session = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { session = null; }
  var open = false, pollTimer = null, lastCount = -1, localMsgs = [];

  // ---------- styles ----------
  var css = [
    ":root{--frc-night:#1b1e3d;--frc-night2:#2b2e55;--frc-lime:#ddee5b;--frc-ink:#14152a;--frc-slate:#5a5f74;--frc-faint:#9195a8;--frc-line:#ececf2;--frc-paper:#f7f6f2}",
    ".frc,.frc *{box-sizing:border-box;font-family:'Hanken Grotesk','Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}",
    /* launcher */
    ".frc-launch{position:fixed;right:22px;bottom:22px;z-index:2147483000;width:64px;height:64px;border-radius:50%;border:none;cursor:pointer;background:radial-gradient(125% 125% at 32% 24%,#f6fcac 0%,#ecf790 22%,#ddee5b 46%,#c8dc46 72%,#a9c033 100%);box-shadow:0 18px 30px rgba(27,30,61,.34),0 7px 12px rgba(27,30,61,.22),inset 0 4px 6px rgba(255,255,255,.7),inset 0 -9px 16px rgba(96,112,18,.45);display:flex;align-items:center;justify-content:center;animation:frcFloat 4.8s cubic-bezier(.37,0,.63,1) infinite;transition:transform .22s cubic-bezier(.2,.8,.2,1),box-shadow .22s;-webkit-tap-highlight-color:transparent;will-change:transform}",
    ".frc-launch::before{content:'';position:absolute;top:10px;left:15px;width:24px;height:15px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,255,255,.95),rgba(255,255,255,0));filter:blur(.5px);pointer-events:none}",
    ".frc-launch::after{content:'';position:absolute;inset:0;border-radius:50%;box-shadow:inset 0 -3px 8px rgba(96,112,18,.35);pointer-events:none}",
    "@keyframes frcFloat{0%{transform:translateY(0) scale(1);box-shadow:0 14px 24px rgba(27,30,61,.32),0 6px 11px rgba(27,30,61,.22),inset 0 4px 6px rgba(255,255,255,.7),inset 0 -9px 16px rgba(96,112,18,.45)}50%{transform:translateY(-10px) scale(1.022);box-shadow:0 30px 44px rgba(27,30,61,.22),0 13px 22px rgba(27,30,61,.14),inset 0 4px 6px rgba(255,255,255,.72),inset 0 -9px 16px rgba(96,112,18,.45)}100%{transform:translateY(0) scale(1);box-shadow:0 14px 24px rgba(27,30,61,.32),0 6px 11px rgba(27,30,61,.22),inset 0 4px 6px rgba(255,255,255,.7),inset 0 -9px 16px rgba(96,112,18,.45)}}",
    ".frc-launch:hover{animation-play-state:paused;transform:translateY(-5px) scale(1.06);box-shadow:0 26px 44px rgba(27,30,61,.38),0 10px 18px rgba(27,30,61,.26),inset 0 4px 6px rgba(255,255,255,.75),inset 0 -9px 16px rgba(96,112,18,.45)}",
    ".frc-launch:active{animation-play-state:paused;transform:translateY(-1px) scale(.95)}",
    ".frc-launch.on{animation-play-state:paused;transform:none}",
    ".frc-launch .ic{position:absolute;display:flex;transition:transform .28s cubic-bezier(.2,.8,.2,1),opacity .2s;filter:drop-shadow(0 1.5px 0 rgba(255,255,255,.55)) drop-shadow(0 1px 1px rgba(60,70,10,.25))}",
    ".frc-launch .ic.chat{transform:scale(1);opacity:1}.frc-launch .ic.close{transform:scale(.5) rotate(-30deg);opacity:0}",
    ".frc-launch.on .ic.chat{transform:scale(.5) rotate(30deg);opacity:0}.frc-launch.on .ic.close{transform:scale(1) rotate(0);opacity:1}",
    ".frc-dot{position:absolute;top:2px;right:2px;width:13px;height:13px;border-radius:50%;background:#ff5a5f;border:2.5px solid #eef37e;transform:scale(0);transition:transform .2s}",
    ".frc-launch.badge .frc-dot{transform:scale(1)}",
    /* panel */
    ".frc-panel{position:fixed;right:22px;bottom:94px;z-index:2147483000;width:388px;max-width:calc(100vw - 32px);height:600px;max-height:calc(100vh - 118px);background:#fff;border-radius:20px;box-shadow:0 20px 60px rgba(27,30,61,.28),0 4px 14px rgba(27,30,61,.12);display:flex;flex-direction:column;overflow:hidden;opacity:0;transform:translateY(16px) scale(.98);transform-origin:bottom right;pointer-events:none;transition:opacity .24s ease,transform .24s cubic-bezier(.2,.8,.2,1)}",
    ".frc-panel.show{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}",
    /* header */
    ".frc-head{background:linear-gradient(135deg,#1b1e3d 0%,#2b2e55 100%);color:#fff;padding:17px 18px;display:flex;align-items:center;gap:12px}",
    ".frc-ava{width:38px;height:38px;border-radius:11px;flex:none;object-fit:cover;box-shadow:0 2px 6px rgba(0,0,0,.25)}",
    ".frc-head .ht{flex:1;min-width:0}",
    ".frc-head .hn{font-size:.98rem;font-weight:700;letter-spacing:-.01em}",
    ".frc-head .hs{display:flex;align-items:center;gap:6px;font-size:.76rem;color:rgba(255,255,255,.72);margin-top:2px}",
    ".frc-online{width:7px;height:7px;border-radius:50%;background:#34e0a1;box-shadow:0 0 0 3px rgba(52,224,161,.2)}",
    ".frc-min{background:rgba(255,255,255,.1);border:none;color:#fff;width:32px;height:32px;border-radius:9px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none;transition:background .15s}",
    ".frc-min:hover{background:rgba(255,255,255,.2)}",
    /* body */
    ".frc-body{flex:1;overflow-y:auto;padding:18px 16px 8px;background:var(--frc-paper);display:flex;flex-direction:column;gap:3px;scroll-behavior:smooth}",
    ".frc-body::-webkit-scrollbar{width:8px}.frc-body::-webkit-scrollbar-thumb{background:rgba(27,30,61,.15);border-radius:8px;border:2px solid var(--frc-paper)}",
    /* intro / prechat */
    ".frc-intro{color:var(--frc-slate);font-size:.92rem;line-height:1.55;margin:2px 2px 14px}",
    ".frc-intro b{color:var(--frc-ink)}",
    ".frc-fld{display:block;margin-bottom:11px}",
    ".frc-fld span{display:block;font-size:.8rem;font-weight:600;color:var(--frc-ink);margin-bottom:5px}",
    ".frc-fld span i{font-weight:400;color:var(--frc-faint);font-style:normal}",
    ".frc-fld input{width:100%;border:1.5px solid var(--frc-line);border-radius:12px;padding:11px 13px;font-size:.95rem;color:var(--frc-ink);background:#fff;outline:none;transition:border-color .15s,box-shadow .15s}",
    ".frc-fld input:focus{border-color:var(--frc-night);box-shadow:0 0 0 3px rgba(27,30,61,.1)}",
    ".frc-start{width:100%;background:var(--frc-night);color:#fff;border:none;border-radius:12px;padding:13px;font-size:.96rem;font-weight:600;cursor:pointer;margin-top:6px;transition:background .18s}",
    ".frc-start:hover{background:#262a52}.frc-start:disabled{opacity:.6;cursor:default}",
    ".frc-err{color:#c0462d;font-size:.84rem;margin:9px 2px 0}",
    /* rows + bubbles */
    ".frc-row{display:flex;align-items:flex-end;gap:8px;margin-top:9px;animation:frcIn .26s cubic-bezier(.2,.8,.2,1)}",
    "@keyframes frcIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}",
    ".frc-row.me{flex-direction:row-reverse}",
    ".frc-bava{width:26px;height:26px;border-radius:8px;flex:none;object-fit:cover}",
    ".frc-bava.ph{visibility:hidden}",
    ".frc-bub{max-width:76%;padding:10px 13px;font-size:.93rem;line-height:1.5;white-space:pre-wrap;word-wrap:break-word;overflow-wrap:anywhere}",
    ".frc-row.them .frc-bub{background:#fff;color:var(--frc-ink);border:1px solid var(--frc-line);border-radius:16px 16px 16px 5px;box-shadow:0 1px 2px rgba(27,30,61,.05)}",
    ".frc-row.me .frc-bub{background:var(--frc-night);color:#fff;border-radius:16px 16px 5px 16px}",
    ".frc-time{font-size:.68rem;color:var(--frc-faint);margin:4px 36px 2px;padding:0}",
    ".frc-time.me{text-align:right}",
    ".frc-note{color:var(--frc-faint);font-size:.82rem;text-align:center;margin:12px 10px}",
    /* typing */
    ".frc-typing{display:flex;gap:4px;padding:12px 14px;background:#fff;border:1px solid var(--frc-line);border-radius:16px 16px 16px 5px;width:max-content}",
    ".frc-typing i{width:7px;height:7px;border-radius:50%;background:#b7bac9;animation:frcBounce 1.2s infinite ease-in-out}",
    ".frc-typing i:nth-child(2){animation-delay:.18s}.frc-typing i:nth-child(3){animation-delay:.36s}",
    "@keyframes frcBounce{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-4px);opacity:1}}",
    /* composer */
    ".frc-foot{border-top:1px solid var(--frc-line);padding:11px 12px;background:#fff}",
    ".frc-inwrap{display:flex;align-items:flex-end;gap:8px;background:#f2f1ea;border:1.5px solid transparent;border-radius:22px;padding:5px 5px 5px 14px;transition:border-color .15s,background .15s}",
    ".frc-inwrap.focus{background:#fff;border-color:var(--frc-line)}",
    ".frc-inwrap textarea{flex:1;border:none;background:transparent;resize:none;outline:none;font-size:.94rem;line-height:1.4;color:var(--frc-ink);max-height:104px;padding:7px 0}",
    ".frc-sendbtn{flex:none;width:38px;height:38px;border-radius:50%;border:none;background:var(--frc-lime);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .14s,background .15s,opacity .15s}",
    ".frc-sendbtn:hover{background:#c7e02c}.frc-sendbtn:active{transform:scale(.92)}.frc-sendbtn:disabled{opacity:.45;cursor:default}",
    ".frc-tag{text-align:center;font-size:.72rem;color:var(--frc-faint);padding:8px 10px 2px}",
    "@media(max-width:480px){.frc-panel{right:0;bottom:0;width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;border-radius:0}.frc-launch{right:16px;bottom:16px}}"
  ].join("");
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  // ---------- icons ----------
  var I_CHAT = '<svg width="27" height="27" viewBox="0 0 24 24" fill="#1b1e3d"><path d="M12 3C6.86 3 3 6.52 3 10.8c0 2.37 1.17 4.46 3.06 5.86-.1.93-.52 2.26-1.63 3.4 1.73-.18 3.4-.86 4.5-1.77.95.26 1.98.4 3.07.4 5.14 0 9-3.52 9-7.89C21 6.52 17.14 3 12 3Z"/><circle cx="8.5" cy="10.8" r="1.25" fill="#dddf"/><circle cx="12" cy="10.8" r="1.25" fill="#dddf"/><circle cx="15.5" cy="10.8" r="1.25" fill="#dddf"/></svg>';
  var I_CLOSE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1b1e3d" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
  var I_MIN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
  var I_SEND = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#1b1e3d" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';

  // ---------- elements ----------
  var launch = document.createElement("button");
  launch.className = "frc frc-launch";
  launch.setAttribute("aria-label", "Chat with FlagRisk support");
  launch.innerHTML = '<span class="frc-dot"></span><span class="ic chat">' + I_CHAT + '</span><span class="ic close">' + I_CLOSE + '</span>';
  document.body.appendChild(launch);

  var panel = document.createElement("div");
  panel.className = "frc frc-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "FlagRisk support chat");
  document.body.appendChild(panel);

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function clock(iso) {
    var d = iso ? new Date(iso) : new Date();
    var h = d.getHours(), m = d.getMinutes();
    var ap = h >= 12 ? "pm" : "am"; h = h % 12; if (h === 0) h = 12;
    return h + ":" + (m < 10 ? "0" + m : m) + " " + ap;
  }
  function api(payload) {
    return fetch("/api/support", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); });
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(session)); } catch (e) {} }

  function headHtml() {
    return '<div class="frc-head"><img class="frc-ava" src="' + LOGO + '" alt="">' +
      '<div class="ht"><div class="hn">FlagRisk Support</div>' +
      '<div class="hs"><span class="frc-online"></span>Online · replies within a day</div></div>' +
      '<button class="frc-min" aria-label="Minimize">' + I_MIN + '</button></div>';
  }
  function wireHead() { var m = panel.querySelector(".frc-min"); if (m) m.addEventListener("click", close); }

  function renderStart(err) {
    panel.innerHTML = headHtml() +
      '<div class="frc-body">' +
      '<p class="frc-intro"><b>Hi there.</b> Tell us how to reach you and we will help. Your conversation stays on this device.</p>' +
      '<label class="frc-fld"><span>Your name <i>(optional)</i></span><input id="frName" type="text" autocomplete="name"></label>' +
      '<label class="frc-fld"><span>Email</span><input id="frEmail" type="email" autocomplete="email" placeholder="you@example.com"></label>' +
      '<label class="frc-fld"><span>Phone <i>(if you prefer)</i></span><input id="frPhone" type="tel" autocomplete="tel" placeholder="0803 000 0000"></label>' +
      '<div style="position:absolute;left:-9999px"><input id="frCompany" tabindex="-1" autocomplete="off"></div>' +
      '<button class="frc-start" id="frStart">Start chat</button>' +
      (err ? '<p class="frc-err">' + esc(err) + '</p>' : '') +
      '</div><div class="frc-tag">You are chatting with FlagRisk Technologies</div>';
    wireHead();
    panel.querySelector("#frStart").addEventListener("click", startChat);
    var f = panel.querySelector("#frEmail"); if (f) setTimeout(function () { f.focus(); }, 300);
  }

  function renderChat() {
    panel.innerHTML = headHtml() +
      '<div class="frc-body" id="frBody"></div>' +
      '<div class="frc-foot"><div class="frc-inwrap" id="frWrap">' +
      '<textarea id="frText" rows="1" placeholder="Write a message..."></textarea>' +
      '<button class="frc-sendbtn" id="frSend" aria-label="Send" disabled>' + I_SEND + '</button>' +
      '</div></div>';
    wireHead();
    var ta = panel.querySelector("#frText"), wrap = panel.querySelector("#frWrap"), send = panel.querySelector("#frSend");
    ta.addEventListener("input", function () {
      ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 104) + "px";
      send.disabled = ta.value.trim() === "";
    });
    ta.addEventListener("focus", function () { wrap.classList.add("focus"); });
    ta.addEventListener("blur", function () { wrap.classList.remove("focus"); });
    ta.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } });
    send.addEventListener("click", sendMsg);
    renderMessages(localMsgs, true);
    loadThread(true);
    setTimeout(function () { ta.focus(); }, 300);
  }

  function bubbleHtml(m) {
    var mine = m.sender !== "support";
    var avatar = mine ? '<span class="frc-bava ph"></span>' : '<img class="frc-bava" src="' + LOGO + '" alt="">';
    return '<div class="frc-row ' + (mine ? "me" : "them") + '">' + avatar +
      '<div class="frc-bub">' + esc(m.body) + '</div></div>' +
      '<div class="frc-time ' + (mine ? "me" : "them") + '">' + clock(m.created_at) + '</div>';
  }
  function renderMessages(msgs, scroll) {
    var body = panel.querySelector("#frBody");
    if (!body) return;
    var intro = '<div class="frc-row them"><img class="frc-bava" src="' + LOGO + '" alt="">' +
      '<div class="frc-bub">Hi ' + esc(session && session.name ? session.name.split(" ")[0] : "there") +
      '. Thanks for reaching out. How can we help today?</div></div>';
    body.innerHTML = intro + msgs.map(bubbleHtml).join("");
    if (scroll) body.scrollTop = body.scrollHeight;
  }
  function showTyping(on) {
    var body = panel.querySelector("#frBody"); if (!body) return;
    var ex = body.querySelector("#frTyping");
    if (on && !ex) {
      var d = document.createElement("div");
      d.className = "frc-row them"; d.id = "frTyping";
      d.innerHTML = '<img class="frc-bava" src="' + LOGO + '" alt=""><div class="frc-typing"><i></i><i></i><i></i></div>';
      body.appendChild(d); body.scrollTop = body.scrollHeight;
    } else if (!on && ex) { ex.remove(); }
  }

  function loadThread(scroll) {
    if (!session) return;
    api({ action: "thread", ticket: session.ticket, token: session.token }).then(function (res) {
      if (!res.ok || !res.d || !res.d.messages) {
        if (res.d && /authori/i.test(res.d.error || "")) { session = null; save(); localMsgs = []; renderStart(); }
        return;
      }
      var msgs = res.d.messages;
      var hadReply = msgs.length > lastCount && lastCount >= 0 && msgs.length && msgs[msgs.length - 1].sender === "support";
      localMsgs = msgs;
      if (msgs.length !== lastCount || scroll) { lastCount = msgs.length; renderMessages(msgs, scroll || hadReply); if (open && hadReply) badge(); }
    });
  }

  function startChat() {
    var name = panel.querySelector("#frName").value.trim();
    var email = panel.querySelector("#frEmail").value.trim();
    var phone = panel.querySelector("#frPhone").value.trim();
    var company = panel.querySelector("#frCompany").value;
    if (!email && !phone) { renderStart("Add an email or phone number so we can reach you."); return; }
    var b = panel.querySelector("#frStart"); b.disabled = true; b.textContent = "Starting...";
    api({ action: "start", name: name, email: email, phone: phone, company: company }).then(function (res) {
      if (!res.ok || !res.d || !res.d.ticket) { renderStart((res.d && res.d.error) || "We could not start the chat. Please try again."); return; }
      session = { ticket: res.d.ticket, token: res.d.token, name: name };
      save(); lastCount = -1; localMsgs = []; renderChat();
    });
  }

  function sendMsg() {
    var ta = panel.querySelector("#frText"); if (!ta || !session) return;
    var body = ta.value.trim(); if (!body) return;
    ta.value = ""; ta.style.height = "auto";
    var sb = panel.querySelector("#frSend"); if (sb) sb.disabled = true;
    localMsgs.push({ sender: "user", body: body, created_at: new Date().toISOString() });
    lastCount = localMsgs.length;
    renderMessages(localMsgs, true);
    showTyping(true);
    api({ action: "send", ticket: session.ticket, token: session.token, body: body }).then(function (res) {
      setTimeout(function () { showTyping(false); loadThread(true); }, 400);
      if (!res.ok) { /* keep optimistic bubble; it will reconcile on next poll */ }
    });
  }

  function badge() { if (!open) launch.classList.add("badge"); }
  function startPolling() { stopPolling(); if (session) pollTimer = setInterval(function () { loadThread(false); }, POLL_MS); }
  function stopPolling() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }

  function openPanel() {
    open = true; launch.classList.add("on", "frc"); launch.classList.remove("badge");
    panel.classList.add("show");
    if (session) { lastCount = -1; renderChat(); } else { renderStart(); }
    startPolling();
  }
  function close() { open = false; launch.classList.remove("on"); panel.classList.remove("show"); stopPolling(); }
  launch.addEventListener("click", function () { open ? close() : openPanel(); });

  // Background poll so a returning visitor sees a reply badge without opening.
  if (session) { loadThread(false); setInterval(function () { if (!open) loadThread(false); }, 45000); }
})();
