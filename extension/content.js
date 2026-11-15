let host, shadow, panel, floatBtn, pollTimer;

// 1. Show a small button when text is selected
document.addEventListener("mouseup", (e) => {
  if (host && e.composedPath().includes(host)) return;
  setTimeout(() => {
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : "";
    if (text.length < 15 || !sel || sel.rangeCount === 0) return hideBtn();
    try {
      showBtn(sel.getRangeAt(0).getBoundingClientRect(), text);
    } catch (_) {
      hideBtn();
    }
  }, 10);
});
document.addEventListener("mousedown", (e) => {
  if (!host || !e.composedPath().includes(host)) hideBtn();
});

// 2. Shadow DOM so the website's CSS can't break our UI
function ensureHost() {
  if (host) return;
  host = document.createElement("div");
  host.style.all = "initial";
  host.style.position = "fixed";
  host.style.zIndex = "2147483647";
  document.documentElement.appendChild(host);
  shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `<style>${CSS}</style><div id="root"></div>`;
}

function showBtn(rect, text) {
  ensureHost();
  hideBtn();
  floatBtn = document.createElement("button");
  floatBtn.className = "pp-fab";
  floatBtn.textContent = "🔍 Anveshan";
  floatBtn.style.top = `${rect.bottom + 8}px`;
  floatBtn.style.left = `${Math.max(8, rect.left)}px`;
  floatBtn.onclick = () => { hideBtn(); investigate(text); };
  shadow.getElementById("root").appendChild(floatBtn);
}
function hideBtn() { if (floatBtn) floatBtn.remove(); floatBtn = null; }

// 3. The side panel
function openPanel() {
  ensureHost();
  if (panel) panel.remove();
  clearInterval(pollTimer);
  panel = document.createElement("div");
  panel.className = "pp-panel";
  panel.innerHTML = `<div class="pp-head"><b>Anveshan</b><button id="pp-x" title="Close">✕</button></div><div id="pp-body"></div>`;
  shadow.getElementById("root").appendChild(panel);
  shadow.getElementById("pp-x").onclick = () => { clearInterval(pollTimer); panel.remove(); };
}
const body = () => shadow.getElementById("pp-body");

function investigate(text) {
  openPanel();
  body().innerHTML = `
    <p class="pp-claim">“${esc(text.slice(0, 300))}”</p>
    <div style="display:flex;align-items:center;gap:8px;margin-top:12px;">
      <span class="pp-spinner"></span>
      <span id="pp-step" style="font-size:13px;color:#57606a;">Starting investigation…</span>
    </div>
  `;
  chrome.runtime.sendMessage({ type: "SUBMIT", text, pageUrl: location.href }, (res) => {
    if (!res || res.error) {
      body().innerHTML = `<p style="color:#cf222e;font-weight:600">Couldn't reach the Anveshan backend.</p><p style="font-size:12px;color:#57606a">Please check that the server is running on port 8000.<br><code>${esc(res ? res.error : "No response from extension background")}</code></p>`;
      return;
    }
    let tries = 0;
    pollTimer = setInterval(() => {
      if (++tries > 90) {
        clearInterval(pollTimer);
        body().innerHTML = "<p style='color:#cf222e'>Investigation timed out. Please try again.</p>";
        return;
      }
      poll(res.job_id);
    }, 1500);
  });
}

function poll(jobId) {
  chrome.runtime.sendMessage({ type: "POLL", jobId }, (job) => {
    if (!job) return;
    if (job.error) {
      clearInterval(pollTimer);
      body().innerHTML = `<p style="color:#cf222e;font-weight:600">Connection error</p><small>${esc(job.error)}</small>`;
      return;
    }
    const stepEl = shadow.getElementById("pp-step");
    if (job.status === "running" && stepEl && job.step) {
      stepEl.textContent = job.step;
    }
    if (job.status === "done") {
      clearInterval(pollTimer);
      render(job.report);
    }
    if (job.status === "failed") {
      clearInterval(pollTimer);
      body().innerHTML = `<p style="color:#cf222e;font-weight:600">Investigation failed.</p><small style="color:#57606a">${esc(job.step)}</small>`;
    }
  });
}

// 4. Draw the report
const COLORS = {
  supported: "#1a7f37", partially_supported: "#b08800", contradicted: "#cf222e",
  not_established: "#6e7781", insufficient_evidence: "#6e7781",
};

function render(r) {
  if (!r || typeof r !== "object") {
    body().innerHTML = `<p>No report received.</p>`;
    return;
  }
  const overall = r.overall || {};
  const label = (overall.label || "insufficient_evidence").toLowerCase();
  const c = COLORS[label] || "#6e7781";
  const st = r.stats ? `<small style="display:block;margin:4px 0 8px;color:#57606a">${r.stats.quotes_verified ?? 0} of ${r.stats.quotes_proposed ?? 0} AI-proposed quotes verified against ${r.stats.sources_read ?? 0} pages</small>` : "";
  const subclaims = Array.isArray(r.subclaims) ? r.subclaims : [];
  const missing = Array.isArray(r.missing) ? r.missing : [];

  body().innerHTML = `
    <div class="pp-verdict" style="border-left-color:${c}">
      <div class="pp-label" style="color:${c}">${esc(label.replace(/_/g, " ").toUpperCase())}</div>
      <p style="margin:4px 0 6px;">${esc(overall.summary || "No summary available.")}</p>
      <small style="color:#57606a;">Evidence coverage: <b>${esc(overall.coverage || "standard")}</b> · Source quality: <b>${esc(overall.source_quality || "standard")}</b></small>
    </div>
    ${subclaims.map(sc => `
      <details class="pp-sc" open>
        <summary><span class="dot" style="background:${COLORS[sc.status] || "#6e7781"}"></span>${esc(sc.text)}</summary>
        <p style="margin:6px 0 4px;font-size:13px;">${esc(sc.explanation || "")}</p>
        ${(sc.evidence || []).map(ev => `
          <div class="pp-ev">
            <div class="pp-rel">${esc((ev.relation || "").replace(/_/g, " "))} · ${esc(ev.source_type || "source")} · ${esc(ev.published || "date unknown")}</div>
            <blockquote>“${esc(ev.quote)}”</blockquote>
            <div style="margin-top:4px;display:flex;align-items:center;justify-content:space-between;font-size:11px;">
              <a href="${esc(ev.url)}" target="_blank" rel="noopener" style="color:#0969da;text-decoration:none;font-weight:500;">${esc(ev.domain)} ↗</a>
              <span class="ok">✔ quote verified</span>
            </div>
            ${ev.dependent_on ? `<div class="warn">⚠ not independent of ${esc(ev.dependent_on)}</div>` : ""}
          </div>`).join("")}
      </details>`).join("")}
    ${missing.length ? `<p style="font-size:12px;margin:8px 0;"><b>What's missing:</b> ${missing.map(esc).join("; ")}</p>` : ""}
    ${st}
    <small class="pp-disc">${esc(r.limitations || "")}</small>`;
}

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, ch => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[ch]));

// 5. Messages from background.js (right-click and hotkey)
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "START") investigate(msg.text);
  if (msg.type === "START_FROM_SELECTION") {
    const t = window.getSelection() ? window.getSelection().toString().trim() : "";
    if (t) investigate(t);
  }
});

const CSS = `
.pp-fab{position:fixed;padding:6px 12px;border:0;border-radius:18px;background:#111;color:#fff;font:600 13px system-ui,-apple-system,sans-serif;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,0.3);transition:transform .1s ease}
.pp-fab:hover{transform:scale(1.05);background:#000}
.pp-panel{position:fixed;top:16px;right:16px;width:390px;max-height:88vh;overflow-y:auto;background:#ffffff;color:#1f2328;font:13.5px/1.45 system-ui,-apple-system,sans-serif;border-radius:12px;box-shadow:0 12px 36px rgba(0,0,0,0.22);padding:16px;border:1px solid #d0d7de}
.pp-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #e1e4e8}
.pp-head b{font-size:16px;font-weight:700}
.pp-head button{border:0;background:none;font-size:16px;cursor:pointer;color:#57606a;padding:2px 6px;border-radius:4px}
.pp-head button:hover{background:#f3f4f6;color:#111}
.pp-claim{background:#f6f8fa;padding:10px;border-radius:8px;font-style:italic;color:#24292f;margin:0 0 10px;border-left:3px solid #0969da}
.pp-verdict{border-left:5px solid;padding:10px 12px;margin:10px 0;background:#f8fafc;border-radius:6px}
.pp-label{font-weight:800;letter-spacing:.5px;font-size:14px}
.pp-sc{margin:8px 0;border:1px solid #d0d7de;border-radius:8px;padding:8px 10px;background:#fff}
.pp-sc summary{cursor:pointer;font-weight:600;font-size:13px;display:flex;align-items:center}
.dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:8px;flex-shrink:0}
.pp-ev{margin:8px 0 4px;padding:8px;background:#f6f8fa;border-radius:6px;border:1px solid #eaeef2}
.pp-rel{font-size:10.5px;color:#57606a;text-transform:uppercase;font-weight:600}
blockquote{margin:6px 0;font-size:12.5px;color:#1f2328;padding-left:8px;border-left:2px solid #d0d7de}
.ok{color:#1a7f37;font-size:11px;font-weight:600}.warn{color:#b08800;font-size:11px;margin-top:4px}
.pp-disc{display:block;margin-top:10px;font-size:11px;color:#6e7781}
.pp-spinner{width:14px;height:14px;border:2px solid #d0d7de;border-top-color:#0969da;border-radius:50%;animation:pp-spin .8s linear infinite;display:inline-block}
@keyframes pp-spin{to{transform:rotate(360deg)}}
`;
