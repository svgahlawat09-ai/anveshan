const APIS = ["http://127.0.0.1:8000", "http://localhost:8000"];

async function apiFetch(endpoint, options = {}) {
  let lastErr;
  for (const base of APIS) {
    try {
      const res = await fetch(`${base}${endpoint}`, options);
      return await res.json();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Failed to connect to backend");
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "pp-investigate",
    title: "Investigate with Anveshan",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "pp-investigate" && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: "START", text: info.selectionText });
  }
});

chrome.commands.onCommand.addListener((cmd, tab) => {
  if (cmd === "investigate-selection" && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: "START_FROM_SELECTION" });
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "SUBMIT") {
    apiFetch("/investigate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: msg.text, page_url: msg.pageUrl }),
    })
      .then(sendResponse)
      .catch((e) => sendResponse({ error: String(e) }));
    return true;
  }
  if (msg.type === "POLL") {
    apiFetch(`/result/${msg.jobId}`)
      .then(sendResponse)
      .catch((e) => sendResponse({ error: String(e) }));
    return true;
  }
});
