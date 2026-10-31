/* FlagRisk website support chat. Self-contained widget: a bubble that opens a
   panel. A visitor gives their name and an email or phone, then chats. The chat
   is a guest ticket in the support queue; a per-chat token (kept here in the
   browser) guards it. Include with <script defer src="/support-chat.js"></script>. */
(function () {
  if (window.__frChat) return;
  window.__frChat = true;

  var KEY = "fr_chat";
  var POLL_MS = 8000;
  var session = null; // { ticket, token, name }
  try { session = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { session = null; }
  var open = false, pollTimer = null, lastCount = -1;

  var css =
    ".frchat-btn{position:fixed;right:20px;bottom:20px;z-index:2147483000;width:58px;height:58px;border-radius:50%;background:#DDEE5B;color:#1B1E3D;border:none;cursor:pointer;box-shadow:0 10px 30px rgba(18,19,35,.28);display:flex;align-items:center;justify-content:center;transition:transform .15s}" +
    ".frchat-btn:hover{transform:translateY(-2px)}" +
    ".frchat-btn svg{width:26px;height:26px}" +
    ".frchat-panel{position:fixed;right:20px;bottom:20px;z-index:2147483000;width:370px;max-width:calc(100vw - 32px);height:560px;max-height:calc(100vh - 40px);background:#fff;border-radius:18px;box-shadow:0 24px 70px rgba(18,19,35,.32);display:none;flex-direction:column;overflow:hidden;font-family:'Hanken Grotesk',system-ui,-apple-system,sans-serif}" +
    ".frchat-panel.show{display:flex}" +
    ".frchat-head{background:#1B1E3D;color:#fff;padding:16px 18px;display:flex;align-items:center;justify-content:space-between}" +
    ".frchat-head h4{margin:0;font-size:1rem;font-weight:700;letter-spacing:-.01em}" +
    ".frchat-head p{margin:2px 0 0;font-size:.8rem;color:rgba(255,255,255,.7)}" +
    ".frchat-x{background:none;border:none;color:rgba(255,255,255,.8);cursor:pointer;font-size:20px;line-height:1;padding:4px}" +
    ".frchat-x:hover{color:#fff}" +
    ".frchat-body{flex:1;overflow-y:auto;padding:16px;background:#faf8f2;display:flex;flex-direction:column;gap:10px}" +
    ".frchat-intro{color:#565a74;font-size:.9rem;line-height:1.5}" +
    ".frchat-field{display:block;margin-bottom:10px}" +
    ".frchat-field span{display:block;font-size:.82rem;font-weight:600;color:#14152A;margin-bottom:5px}" +
    ".frchat-field input{width:100%;border:1.5px solid #e7e3d9;border-radius:10px;padding:10px 12px;font-size:.95rem;font-family:inherit;color:#14152A;outline:none}" +
    ".frchat-field input:focus{border-color:#1B1E3D}" +
    ".frchat-start{width:100%;background:#1B1E3D;color:#fff;border:none;border-radius:10px;padding:11px;font-size:.95rem;font-weight:600;font-family:inherit;cursor:pointer;margin-top:4px}" +
    ".frchat-start:hover{background:#24264a}" +
    ".frchat-start:disabled{opacity:.6;cursor:default}" +
    ".frchat-err{color:#b4472a;font-size:.84rem;margin:8px 0 0}" +
    ".frchat-msg{max-width:84%;padding:9px 12px;border-radius:13px;font-size:.92rem;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}" +
    ".frchat-msg.them{align-self:flex-start;background:#fff;border:1px solid #e7e3d9;color:#14152A}" +
    ".frchat-msg.me{align-self:flex-end;background:#1B1E3D;color:#fff}" +
    ".frchat-meta{font-size:.68rem;text-transform:uppercase;letter-spacing:.05em;color:#8d90a6;margin:0 2px -4px}" +
    ".frchat-meta.me{align-self:flex-end}.frchat-meta.them{align-self:flex-start}" +
    ".frchat-note{color:#8d90a6;font-size:.8rem;text-align:center;margin:6px 0}" +
    ".frchat-foot{border-top:1px solid #eee;padding:10px;display:flex;gap:8px;align-items:flex-end;background:#fff}" +
    ".frchat-foot textarea{flex:1;border:1.5px solid #e7e3d9;border-radius:10px;padding:9px 11px;font-size:.92rem;font-family:inherit;color:#14152A;outline:none;resize:none;max-height:100px;line-height:1.4}" +
    ".frchat-foot textarea:focus{border-color:#1B1E3D}" +
    ".frchat-send{flex:none;background:#DDEE5B;color:#1B1E3D;border:none;border-radius:10px;padding:0 15px;height:40px;font-weight:700;font-family:inherit;cursor:pointer}" +
    ".frchat-send:hover{background:#c7e02c}" +
    "@media(max-width:480px){.frchat-panel{right:0;bottom:0;width:100vw;max-width:100vw;height:100vh;max-height:100vh;border-radius:0}.frchat-btn{right:16px;bottom:16px}}";

  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  var BUBBLE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 20l1.1-5.4A8.5 8.5 0 1 1 21 11.5z"/></svg>';

  var btn = document.createElement("button");
  btn.className = "frchat-btn";
  btn.setAttribute("aria-label", "Chat with FlagRisk support");
  btn.innerHTML = BUBBLE;
  document.body.appendChild(btn);

  var panel = document.createElement("div");
  panel.className = "frchat-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "FlagRisk support chat");
  document.body.appendChild(panel);

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function api(payload) {
    return fetch("/api/support", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); });
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(session)); } catch (e) {} }

  function headHtml() {
    return '<div class="frchat-head"><div><h4>FlagRisk Support</h4><p>We reply within one working day</p></div><button class="frchat-x" aria-label="Close">&times;</button></div>';
  }

  function renderStart(err) {
    panel.innerHTML = headHtml() +
      '<div class="frchat-body"><p class="frchat-intro">Hi. Tell us how to reach you and we will help. Your chat stays on this device.</p>' +
      '<label class="frchat-field"><span>Your name <span style="font-weight:400;color:#8d90a6">(optional)</span></span><input id="frName" type="text" autocomplete="name"></label>' +
      '<label class="frchat-field"><span>Email</span><input id="frEmail" type="email" autocomplete="email" placeholder="you@example.com"></label>' +
      '<label class="frchat-field"><span>Phone <span style="font-weight:400;color:#8d90a6">(if you prefer)</span></span><input id="frPhone" type="tel" autocomplete="tel" placeholder="0803 000 0000"></label>' +
      '<div style="position:absolute;left:-9999px"><input id="frCompany" tabindex="-1" autocomplete="off"></div>' +
      '<button class="frchat-start" id="frStart">Start chat</button>' +
      (err ? '<p class="frchat-err">' + esc(err) + '</p>' : '') + '</div>';
    wireHead();
    panel.querySelector("#frStart").addEventListener("click", startChat);
  }

  function renderChat() {
    panel.innerHTML = headHtml() +
      '<div class="frchat-body" id="frBody"><div class="frchat-note">Loading...</div></div>' +
      '<div class="frchat-foot"><textarea id="frText" rows="1" placeholder="Write a message"></textarea><button class="frchat-send" id="frSend">Send</button></div>';
    wireHead();
    var ta = panel.querySelector("#frText");
    ta.addEventListener("input", function () { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 100) + "px"; });
    ta.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } });
    panel.querySelector("#frSend").addEventListener("click", sendMsg);
    loadThread(true);
  }

  function wireHead() {
    var x = panel.querySelector(".frchat-x");
    if (x) x.addEventListener("click", close);
  }

  function renderMessages(msgs) {
    var body = panel.querySelector("#frBody");
    if (!body) return;
    if (!msgs.length) {
      body.innerHTML = '<div class="frchat-note">Send your first message and we will take it from here.</div>';
      return;
    }
    var html = "";
    msgs.forEach(function (m) {
      var mine = m.sender !== "support";
      var side = mine ? "me" : "them";
      var who = mine ? "You" : "FlagRisk";
      html += '<div class="frchat-meta ' + side + '">' + who + '</div>' +
        '<div class="frchat-msg ' + side + '">' + esc(m.body) + '</div>';
    });
    body.innerHTML = html;
    body.scrollTop = body.scrollHeight;
  }

  function loadThread(scroll) {
    if (!session) return;
    api({ action: "thread", ticket: session.ticket, token: session.token }).then(function (res) {
      if (!res.ok || !res.d || !res.d.messages) {
        if (res.d && /authori/i.test(res.d.error || "")) { session = null; save(); renderStart(); }
        return;
      }
      var msgs = res.d.messages;
      if (msgs.length !== lastCount) { lastCount = msgs.length; renderMessages(msgs); }
      else if (scroll) { renderMessages(msgs); }
    });
  }

  function startChat() {
    var name = panel.querySelector("#frName").value.trim();
    var email = panel.querySelector("#frEmail").value.trim();
    var phone = panel.querySelector("#frPhone").value.trim();
    var company = panel.querySelector("#frCompany").value;
    if (!email && !phone) { renderStart("Add an email or phone number so we can reach you."); return; }
    var btnEl = panel.querySelector("#frStart");
    btnEl.disabled = true; btnEl.textContent = "Starting...";
    api({ action: "start", name: name, email: email, phone: phone, company: company }).then(function (res) {
      if (!res.ok || !res.d || !res.d.ticket) {
        renderStart((res.d && res.d.error) || "We could not start the chat. Please try again.");
        return;
      }
      session = { ticket: res.d.ticket, token: res.d.token, name: name };
      save(); lastCount = -1; renderChat();
    });
  }

  function sendMsg() {
    var ta = panel.querySelector("#frText");
    if (!ta) return;
    var body = ta.value.trim();
    if (!body || !session) return;
    ta.value = ""; ta.style.height = "auto";
    api({ action: "send", ticket: session.ticket, token: session.token, body: body }).then(function (res) {
      if (!res.ok) { ta.value = body; return; }
      loadThread(true);
    });
  }

  function startPolling() { stopPolling(); if (session) pollTimer = setInterval(function () { if (open && session) loadThread(false); }, POLL_MS); }
  function stopPolling() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }

  function openPanel() {
    open = true; btn.style.display = "none"; panel.classList.add("show");
    if (session) { lastCount = -1; renderChat(); } else { renderStart(); }
    startPolling();
  }
  function close() {
    open = false; panel.classList.remove("show"); btn.style.display = "flex"; stopPolling();
  }
  btn.addEventListener("click", openPanel);
})();
