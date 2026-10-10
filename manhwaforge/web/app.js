"use strict";
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const API = "/api";
  const STAGE_LABEL = { director: "Director", style: "Style", art: "Art + QA", typeset: "Lettering", assembly: "Layout", polish: "Polish" };
  const STAGE_W = { director: 10, style: 5, art: 40, typeset: 20, assembly: 20, polish: 5 };
  const AGENTS = [
    ["Director", "Storyboard"], ["Artist", "Style + renders"], ["Critic", "Amazement score"], ["Typesetter", "Bubbles + SFX"], ["Assembler", "Layout + reader"],
  ];
  const EXAMPLE = `# The Last Hunter of Seoul

Characters:
- Jin: a tall slim young man with messy black hair, sharp crimson eyes and a long black coat
- Mira: a cheerful girl with long silver hair, blue eyes and a white school uniform

Rain hammered the empty streets of Seoul at midnight. Jin stood alone on the rooftop, staring at the neon city below.
"You can't go out there alone!" Mira shouted as she ran up behind him. Her uniform was soaked.
Jin did not turn around. "I have to. Nobody else can stop it," he said quietly.
Suddenly the sky cracked open with lightning. A monster, vast and dark, rose from the ruins of the old tower. Mira gasped, tears in her eyes.
"Jin, please!" she whispered.
Jin drew his sword and charged. The blade slashed through the darkness and the monster roared.
When the dust settled, Jin knelt in the rubble, exhausted. Mira smiled through her tears. "You did it," she said.`;

  let files = [];             // {file, url}
  let current = null;         // job id being watched
  let eventCursor = 0;
  let pollTimer = null;
  let health = null;
  const logLines = [];
  let lastAgentMsg = {};

  // ------------------------------------------------------------- helpers
  async function api(path, opts) {
    const r = await fetch(API + path, opts);
    if (!r.ok) {
      let msg = r.statusText;
      try { msg = (await r.json()).detail || msg; } catch (_) { /* ignore */ }
      throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
    return r;
  }
  const pct = (x, d = 0) => (x * 100).toFixed(d) + "%";
  function el(tag, props = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === "class") n.className = v; else if (k === "text") n.textContent = v; else if (k.startsWith("on")) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v);
    }
    for (const c of kids) if (c) n.append(c);
    return n;
  }
  function setOffline(off) { $("#offline").hidden = !off; }

  // ------------------------------------------------------------- init
  async function init() {
    try {
      health = await (await api("/health")).json();
      const chips = $("#chips");
      chips.replaceChildren(
        ...[["Gate", `Amazement ≥ ${health.amazement_threshold}`], ["Halt", `${Math.round(health.halt_at * 100)}% hard save`],
            ["Art", health.image_provider], ["Director", health.llm_director ? "LLM" : "heuristic"]]
          .map(([k, v]) => el("span", { class: "chip" }, `${k}: `, el("b", { text: v }))));
      $("#gate").textContent = health.amazement_threshold;
      const styles = await (await api("/styles")).json();
      const sel = $("#style");
      for (const s of styles) sel.append(el("option", { value: s.key, text: s.name, title: s.description }));
      setOffline(false);
    } catch (e) { setOffline(true); }
    await refreshHistory();
    setInterval(refreshHistory, 6000);
    const hash = location.hash.replace("#", "");
    if (hash) watch(hash);
  }

  // ------------------------------------------------------------- form
  $("#story").addEventListener("input", () => { $("#count").textContent = $("#story").value.length.toLocaleString() + " chars"; });
  $("#panels").addEventListener("input", () => { $("#panelsVal").textContent = $("#panels").value; });
  $("#example").addEventListener("click", () => { $("#story").value = EXAMPLE; $("#story").dispatchEvent(new Event("input")); });

  const drop = $("#drop"), picker = $("#file");
  drop.addEventListener("click", () => picker.click());
  drop.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); picker.click(); } });
  picker.addEventListener("change", () => { addFiles(picker.files); picker.value = ""; });
  ["dragenter", "dragover"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", (e) => addFiles(e.dataTransfer.files));
  // dropping anywhere on the page also works
  addEventListener("dragover", (e) => e.preventDefault());
  addEventListener("drop", (e) => { if (!drop.contains(e.target)) { e.preventDefault(); addFiles(e.dataTransfer.files); } });

  function addFiles(list) {
    for (const f of list) {
      if (files.some((x) => x.file.name === f.name && x.file.size === f.size)) continue;
      files.push({ file: f, url: f.type.startsWith("image/") ? URL.createObjectURL(f) : null });
    }
    renderFiles();
  }
  function renderFiles() {
    $("#files").replaceChildren(...files.map((f, i) => el("li", {},
      f.url ? el("img", { src: f.url, alt: "" }) : el("span", { class: "ic", text: (f.file.name.split(".").pop() || "").slice(0, 4).toUpperCase() }),
      el("span", { class: "nm", text: f.file.name, title: f.file.name }),
      el("small", { class: "hint", text: (f.file.size / 1024).toFixed(0) + " KB" }),
      el("button", { type: "button", "aria-label": "Remove " + f.file.name, text: "×", onclick: () => { if (f.url) URL.revokeObjectURL(f.url); files.splice(i, 1); renderFiles(); } }))));
  }

  $("#form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#formError"); err.hidden = true;
    const hasTextFile = files.some((f) => /\.(txt|md|markdown|json)$/i.test(f.file.name));
    if (!$("#story").value.trim() && !hasTextFile) {
      err.textContent = "Write a story or description (or add a script file). Sketches alone can't replace the story."; err.hidden = false; return;
    }
    const fd = new FormData();
    fd.set("story", $("#story").value); fd.set("title", $("#title").value); fd.set("format", $("#format").value);
    fd.set("style", $("#style").value); fd.set("panels", $("#panels").value); fd.set("series", $("#series").value);
    for (const f of files) fd.append("files", f.file, f.file.name);
    const btn = $("#go"); btn.disabled = true; btn.textContent = "Starting…";
    try {
      const { id } = await (await api("/jobs", { method: "POST", body: fd })).json();
      watch(id);
      refreshHistory();
    } catch (ex) { err.textContent = ex.message; err.hidden = false; }
    finally { btn.disabled = false; btn.textContent = "Generate chapter"; }
  });

  // ------------------------------------------------------------- history
  async function refreshHistory() {
    try {
      const jobs = await (await api("/jobs")).json();
      setOffline(false);
      const ul = $("#history");
      if (!jobs.length) { ul.replaceChildren(el("li", { class: "empty", text: "Nothing yet." })); return; }
      ul.replaceChildren(...jobs.slice(0, 12).map((j) => el("li", { class: j.id === current ? "sel" : "", onclick: () => watch(j.id) },
        el("span", { class: "t", text: j.title || "Untitled" }),
        el("span", { class: "pill " + j.status, text: j.status === "running" ? pct(j.progress) : j.status }))));
    } catch (_) { setOffline(true); }
  }

  // ------------------------------------------------------------- watching a job
  function watch(id) {
    clearTimeout(pollTimer);
    current = id; eventCursor = 0; logLines.length = 0; lastAgentMsg = {};
    $("#log").replaceChildren();
    $("#panels-grid").replaceChildren();
    $("#empty").hidden = true; $("#monitor").hidden = false;
    history.replaceState(null, "", "#" + id);
    buildAgents();
    tick();
  }
  function buildAgents() {
    $("#agents").replaceChildren(...AGENTS.map(([n, sub]) => el("div", { class: "agent", id: "ag-" + n }, el("b", {}, el("i", { class: "dot" }), n), el("small", { text: sub }))));
    $("#stages").replaceChildren(...Object.keys(STAGE_LABEL).map((k) => el("div", { id: "st-" + k }, el("span", { text: `${STAGE_LABEL[k]} ${STAGE_W[k]}%` }), el("div", { class: "sb" }, el("i")))));
  }

  async function tick() {
    const id = current;
    try {
      const [job, ev] = await Promise.all([
        api("/jobs/" + id).then((r) => r.json()),
        api(`/jobs/${id}/events?since=${eventCursor}`).then((r) => r.json()),
      ]);
      if (id !== current) return;
      setOffline(false);
      for (const e of ev.events) { appendLog(e); eventCursor = e.n + 1; }
      render(job);
      const live = job.status === "queued" || job.status === "running";
      pollTimer = setTimeout(tick, live ? 900 : 4000);
    } catch (e) {
      setOffline(true);
      pollTimer = setTimeout(tick, 2500);
    }
  }

  function appendLog(e) {
    lastAgentMsg[e.agent] = e.msg;
    const box = $("#log");
    const stick = box.scrollTop + box.clientHeight >= box.scrollHeight - 30;
    const row = el("div", { class: `${e.agent} ${e.level}` }, el("span", { class: "ag", text: e.agent }), document.createTextNode(e.msg));
    if (e.level === "debug" && !$("#verbose").checked) row.hidden = true;
    row.dataset.debug = e.level === "debug" ? "1" : "";
    box.append(row);
    while (box.childElementCount > 600) box.firstChild.remove();
    if (stick) box.scrollTop = box.scrollHeight;
  }
  $("#verbose").addEventListener("change", () => { for (const r of $("#log").children) r.hidden = r.dataset.debug === "1" && !$("#verbose").checked; });

  function render(j) {
    $("#jobTitle").textContent = j.title || "Untitled chapter";
    const pill = $("#pill"); pill.textContent = j.status; pill.className = "pill " + j.status;
    $("#fill").style.width = pct(Math.min(1, j.progress), 1);
    $("#barWrap").setAttribute("aria-valuenow", Math.round(j.progress * 100));
    $("#sProg").textContent = pct(j.progress, 1);
    $("#sConf").textContent = pct(j.confidence, 1);
    $("#sAmaz").textContent = j.mean_amazement == null ? "–" : j.mean_amazement.toFixed(2);
    const done = j.panels.filter((p) => p.state === "done").length;
    $("#sDone").textContent = `${done}/${j.panels.length}`;

    for (const [k, f] of Object.entries(j.stage_progress || {})) { const i = $(`#st-${k} .sb i`); if (i) i.style.width = pct(f); }

    const live = j.status === "running" || j.status === "queued";
    const stage = j.stage;
    const active = {
      Director: stage === "director", Artist: stage === "style" || stage === "art",
      Critic: stage === "art", Typesetter: stage === "art" || stage === "typeset", Assembler: stage === "assembly" || stage === "polish",
    };
    const finished = { Director: j.stage_progress.director >= 1, Artist: j.stage_progress.art >= 1, Critic: j.stage_progress.art >= 1,
      Typesetter: j.stage_progress.typeset >= 1, Assembler: j.stage_progress.assembly >= 1 };
    for (const [n] of AGENTS) {
      const a = $("#ag-" + n); if (!a) continue;
      a.className = "agent" + (finished[n] ? " done" : live && active[n] ? " on" : "");
      const msg = lastAgentMsg[n]; if (msg) a.querySelector("small").textContent = msg;
    }

    $("#halt").hidden = j.status !== "halted";
    $("#done").hidden = j.status !== "completed";
    $("#failed").hidden = !["failed", "interrupted", "cancelled"].includes(j.status);
    if (!$("#failed").hidden) $("#failText").textContent = j.error || (j.status === "cancelled" ? "Stopped by instruction. The 95% package is still downloadable." : "");
    if (j.status === "halted") {
      $("#haltText").textContent = `${j.halt_reason}. The package (reader, strip/slides, panels, character sheets, script, completion summary) is saved. Nothing further runs until you send an instruction.`;
    }
    const z = `${API}/jobs/${j.id}/download`;
    $("#dlHalt").href = z; $("#dlDone").href = z;
    if (j.status === "completed") $("#doneText").textContent = `Chapter complete. ${j.panels.length} panels, mean amazement ${(j.mean_amazement || 0).toFixed(2)}.`;
    renderTiles(j);
    refreshHistory();
  }

  const tileCache = new Map();
  function renderTiles(j) {
    const ul = $("#panels-grid");
    j.panels.forEach((p, i) => {
      const sig = [p.state, p.attempts, p.score, p.below_threshold].join("|");
      let li = tileCache.get(j.id + ":" + i);
      if (!li || !ul.contains(li)) {
        li = el("li", { class: "tile" }); tileCache.set(j.id + ":" + i, li); ul.append(li);
      }
      if (li.dataset.sig === sig) return;
      li.dataset.sig = sig;
      const gate = health ? health.amazement_threshold : 7.5;
      const has = p.attempts > 0;
      const ph = el("div", { class: "ph" });
      if (has) {
        ph.append(el("img", { src: `${API}/jobs/${j.id}/files/work/thumbs/panel_${String(i + 1).padStart(2, "0")}.jpg?v=${encodeURIComponent(sig)}`, alt: `Panel ${i + 1}: ${p.summary || p.shot}`, loading: "lazy" }));
        if (p.score != null) ph.append(el("span", { class: "score " + (p.score >= gate ? "pass" : "fail"), text: p.score.toFixed(1) }));
      } else ph.append(el("span", { class: "spin" }));
      const stateTxt = p.state === "done" ? "done" : p.state === "typesetting" ? "lettering" : p.state === "rendering" ? `render · try ${p.attempts || 1}` : "waiting";
      li.className = "tile" + (p.below_threshold && p.state === "done" ? " flag" : "");
      li.replaceChildren(ph, el("div", { class: "meta" }, el("b", { text: `${i + 1}. ${p.shot.replace(/_/g, " ")}` }),
        el("span", { text: stateTxt + (p.attempts > 1 ? ` · ${p.attempts} attempts` : "") + (p.below_threshold && p.state === "done" ? " · flagged" : "") })));
    });
  }

  // ------------------------------------------------------------- halt / resume
  async function sendResume(action) {
    try {
      await api(`/jobs/${current}/resume`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ instruction: $("#instr").value, action }) });
      clearTimeout(pollTimer); tick();
    } catch (e) { alert(e.message); }
  }
  $("#finalize").addEventListener("click", () => sendResume("finalize"));
  $("#cancel").addEventListener("click", () => { if (confirm("Stop here? The 95% package stays downloadable but the last 5% will not run.")) sendResume("cancel"); });

  // ------------------------------------------------------------- reader mode
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-read]") || !current) return;
    const url = `${API}/jobs/${current}/files/output/reader/index.html`;
    $("#readerFrame").src = url; $("#readerOpen").href = url; $("#readerTitle").textContent = $("#jobTitle").textContent;
    $("#reader").hidden = false; document.body.style.overflow = "hidden"; $("#readerClose").focus();
  });
  function closeReader() { $("#reader").hidden = true; $("#readerFrame").src = "about:blank"; document.body.style.overflow = ""; }
  $("#readerClose").addEventListener("click", closeReader);
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#reader").hidden) closeReader(); });

  init();
})();
