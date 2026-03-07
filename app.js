const STORAGE_KEY = "mx-suspension-tool-gh-blue-v1";
const DEFAULT_BIKES = ["KX250F", "KX85", "KTM 65 SX", "SX-F 250"];
const INITIAL_FORM = {
  bike: "KX250F",
  bikeCustom: "",
  track: "",
  surface: "mixed",
  weather: "damp",
  forkCompression: 12,
  forkRebound: 12,
  shockHigh: "1.5",
  shockLow: 12,
  shockRebound: 12,
  sag: 105,
  notes: "",
};

const SYMPTOM_GUIDE = {
  neutral: {
    label: "Kein Symptom ausgewählt",
    tips: [
      "Das Diagramm bewertet X und Y getrennt. So sind auch Kombinationen wie Hartboden/Trocken oder Sand/Nass möglich.",
      "Nimm das aktuelle Setup als Basis und wähle bei Bedarf ein Fahrgefühl-Symptom aus.",
      "Die Tipps sind bewusst kurz gehalten und können später fahrzeugspezifisch werden."
    ]
  },
  turn_in: {
    label: "Lenkt schlecht ein",
    tips: [
      "Gabel leicht durchschieben, damit mehr Last aufs Vorderrad kommt.",
      "Vorn etwas weicher oder hinten leicht höher beziehungsweise weniger Sag prüfen.",
      "Reifendruck und Reifenbild immer mitdenken, nicht nur Clicks ändern."
    ]
  },
  front_sand_push: {
    label: "Vorderrad rutscht im Sand weg",
    tips: [
      "Setup tendenziell etwas Richtung Hartboden verschieben, damit das Vorderrad besser führt.",
      "Die Gabel nicht unnötig weich abstimmen, damit das Vorderrad mehr Support hat.",
      "Zusätzlich Fahrerposition und Last auf dem Vorderrad prüfen."
    ]
  },
  rear_kick: {
    label: "Heck kickt über Kanten",
    tips: [
      "Shock-Rebound prüfen. Oft etwas schneller öffnen lassen, wenn das Heck stehen bleibt und dann schlägt.",
      "High-Speed hinten nicht zu straff fahren, wenn harte Schläge das Bike aushebeln.",
      "Sag kontrollieren, weil ein unpassender Grundstand viele Symptome verfälscht."
    ]
  },
  harsh_front: {
    label: "Vorne hart oder unruhig",
    tips: [
      "Gabel-Compression etwas öffnen und prüfen, ob kleine Schläge besser gefiltert werden.",
      "Zu langsamer Rebound kann die Gabel packen lassen. Rebound nicht nur bei Compression anschauen.",
      "Servicezustand und Ölstand der Gabel später ebenfalls erfassen."
    ]
  },
  lazy_rear: {
    label: "Heck schwammig oder träge",
    tips: [
      "Weniger Sag oder etwas mehr Low-Speed hinten testen.",
      "Zu weiche Basis hinten kann das Bike in langen Kurven breit machen.",
      "Nur kleine Schritte ändern und danach direkt eine kurze Vergleichsrunde fahren."
    ]
  }
};

const state = {
  bikes: [...DEFAULT_BIKES],
  setups: [],
  bikeDrafts: {},
  form: { ...INITIAL_FORM },
  selectedTrack: "__all__",
  selectedSymptom: "neutral"
};

function $(id) { return document.getElementById(id); }
function clamp(value, min, max) { return Math.min(max, Math.max(min, Number(value) || 0)); }
function clampFloat(value, min, max) { return Math.min(max, Math.max(min, Number(value) || 0)); }
function getHighspeedNumeric(value) { return value === "n.v." ? 1.5 : clampFloat(value, 0.5, 3.0); }
function createBikeDraft(bikeName) { return { ...INITIAL_FORM, bike: bikeName, bikeCustom: bikeName === "__custom__" ? "" : "" }; }
function mapWeatherLabel(score) { if (score <= 24) return "Nass"; if (score <= 42) return "Feucht"; if (score <= 60) return "Neutral"; if (score <= 78) return "Trocken"; return "Sehr trocken"; }
function mapSurfaceLabel(score) { if (score <= 22) return "Hartboden"; if (score <= 40) return "Hart/Misch"; if (score <= 60) return "Mischboden"; if (score <= 78) return "Lehmig"; return "Sand"; }
function setupLabel(surface, weather) { return `${surface} · ${weather}`; }

function getResolvedBike() {
  return state.form.bike === "__custom__" ? state.form.bikeCustom.trim() : state.form.bike;
}

function getActiveBikeKey() {
  if (state.form.bike === "__custom__") {
    return state.form.bikeCustom.trim() ? `custom:${state.form.bikeCustom.trim()}` : "__custom__";
  }
  return state.form.bike;
}

function getSetupAnalysis(form) {
  const forkCompNorm = form.forkCompression / 22;
  const forkRebNorm = form.forkRebound / 22;
  const shockLowNorm = form.shockLow / 22;
  const shockRebNorm = form.shockRebound / 22;
  const shockHighNorm = (getHighspeedNumeric(form.shockHigh) - 0.5) / 2.5;
  const sagNorm = (clamp(form.sag, 90, 120) - 90) / 30;

  const frontFirmness = forkCompNorm * 0.55 + forkRebNorm * 0.25 + (1 - sagNorm) * 0.2;
  const rearFirmness = shockLowNorm * 0.45 + shockHighNorm * 0.3 + shockRebNorm * 0.15 + (1 - sagNorm) * 0.1;
  const overallFirmness = frontFirmness * 0.52 + rearFirmness * 0.48;

  const holdUpBias = (1 - sagNorm) * 0.45 + shockHighNorm * 0.2 + shockLowNorm * 0.15 + forkRebNorm * 0.1 + shockRebNorm * 0.1;
  const plushBias = sagNorm * 0.4 + (1 - shockHighNorm) * 0.2 + (1 - shockLowNorm) * 0.2 + (1 - forkCompNorm) * 0.2;
  const cornerBias = forkCompNorm * 0.3 + forkRebNorm * 0.18 + (1 - sagNorm) * 0.22 + (1 - shockHighNorm) * 0.08 + (1 - shockLowNorm) * 0.1 + (1 - shockRebNorm) * 0.12;
  const stabilityBias = shockHighNorm * 0.22 + shockLowNorm * 0.22 + shockRebNorm * 0.18 + sagNorm * 0.18 + forkCompNorm * 0.1 + forkRebNorm * 0.1;

  const x = clamp(Math.round(50 + (stabilityBias - cornerBias) * 55 + (overallFirmness - 0.5) * 18), 10, 90);
  const y = clamp(Math.round(50 + (holdUpBias - plushBias) * 55), 10, 90);
  const reasons = [];
  if (forkCompNorm >= 0.68) reasons.push("straffe Gabel-Compression");
  if (shockLowNorm >= 0.68) reasons.push("straffes Low-Speed hinten");
  if (shockHighNorm >= 0.6) reasons.push("viel High-Speed-Dämpfung");
  if (sagNorm <= 0.35) reasons.push("wenig Sag / mehr Hold-up");
  if (forkCompNorm <= 0.36) reasons.push("weiche Gabel-Compression");
  if (shockLowNorm <= 0.36) reasons.push("weiches Low-Speed hinten");
  if (shockHighNorm <= 0.24) reasons.push("wenig High-Speed-Dämpfung");
  if (sagNorm >= 0.62) reasons.push("mehr Sag / mehr Ruhe hinten");
  if (forkRebNorm >= 0.68) reasons.push("langsamerer Gabel-Rebound");
  if (shockRebNorm >= 0.68) reasons.push("langsamerer Shock-Rebound");

  return {
    x, y,
    surfaceLabel: mapSurfaceLabel(x),
    weatherLabel: mapWeatherLabel(y),
    confidence: Math.round(58 + Math.abs(overallFirmness - 0.5) * 45 + Math.abs(holdUpBias - plushBias) * 15),
    reasons: reasons.slice(0, 5),
    firmness: Math.round(overallFirmness * 100),
    holdUp: Math.round(holdUpBias * 100)
  };
}

function runSanityChecks() {
  console.assert(clamp(30, 0, 22) === 22, "clamp upper bound failed");
  console.assert(clamp(-5, 0, 22) === 0, "clamp lower bound failed");
  console.assert(getHighspeedNumeric("n.v.") === 1.5, "highspeed n.v. mapping failed");
  console.assert(getHighspeedNumeric("3.5") === 3, "highspeed clamp max failed");
  console.assert(getHighspeedNumeric("0") === 0.5, "highspeed clamp min failed");
  const neutral = getSetupAnalysis(INITIAL_FORM);
  console.assert(neutral.x >= 10 && neutral.x <= 90, "analysis x out of range");
  console.assert(neutral.y >= 10 && neutral.y <= 90, "analysis y out of range");
  console.assert(typeof neutral.surfaceLabel === "string", "surface label missing");
  console.assert(typeof neutral.weatherLabel === "string", "weather label missing");
  const stiff = getSetupAnalysis({ ...INITIAL_FORM, forkCompression: 22, forkRebound: 22, shockLow: 22, shockRebound: 22, shockHigh: "3.0", sag: 90 });
  console.assert(stiff.x >= neutral.x, "stiff setup should not move left of neutral unexpectedly");
}

function saveStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ bikes: state.bikes, setups: state.setups, bikeDrafts: state.bikeDrafts }));
}

function loadStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data.bikes)) state.bikes = data.bikes;
    if (Array.isArray(data.setups)) state.setups = data.setups;
    if (data.bikeDrafts && typeof data.bikeDrafts === "object") state.bikeDrafts = data.bikeDrafts;
  } catch (error) {
    console.warn("Konnte lokalen Speicher nicht laden", error);
  }
}

function persistActiveDraft() {
  const key = getActiveBikeKey();
  if (!key) return;
  state.bikeDrafts[key] = { ...state.form };
  saveStorage();
}

function getBikeSetups() {
  const resolvedBike = getResolvedBike();
  if (!resolvedBike) return [];
  return state.setups.filter(entry => entry.bike === resolvedBike);
}

function getBikeTracks() {
  const grouped = new Map();
  getBikeSetups().forEach(entry => {
    const key = entry.track?.trim() || "Ohne Strecke";
    if (!grouped.has(key)) grouped.set(key, { name: key, count: 0, latest: entry.createdAt });
    const current = grouped.get(key);
    current.count += 1;
    if (new Date(entry.createdAt) > new Date(current.latest)) current.latest = entry.createdAt;
  });
  return Array.from(grouped.values()).sort((a, b) => new Date(b.latest) - new Date(a.latest));
}

function getVisibleSetups() {
  const bikeSetups = getBikeSetups();
  if (state.selectedTrack === "__all__") return bikeSetups;
  return bikeSetups.filter(entry => (entry.track?.trim() || "Ohne Strecke") === state.selectedTrack);
}

function switchBike(bikeName) {
  state.selectedTrack = "__all__";
  const existingDraft = state.bikeDrafts[bikeName];
  state.form = existingDraft ? { ...existingDraft } : createBikeDraft(bikeName);
  render();
}

function addBike() {
  const name = $("newBikeInput").value.trim();
  if (!name) return;
  if (state.bikes.includes(name)) {
    switchBike(name);
    $("newBikeInput").value = "";
    return;
  }
  state.bikes.push(name);
  state.bikeDrafts[name] = createBikeDraft(name);
  state.form = createBikeDraft(name);
  state.selectedTrack = "__all__";
  $("newBikeInput").value = "";
  saveStorage();
  render();
}

function deleteBike() {
  const bikeName = getResolvedBike()?.trim();
  if (!bikeName || state.form.bike === "__custom__") return;
  const confirmed = window.confirm(`Motorrad "${bikeName}" inklusive zugehöriger gespeicherter Setups löschen?`);
  if (!confirmed) return;
  state.bikes = state.bikes.filter(b => b !== bikeName);
  state.setups = state.setups.filter(entry => entry.bike !== bikeName);
  delete state.bikeDrafts[bikeName];
  state.selectedTrack = "__all__";
  if (state.bikes.length > 0) {
    const nextBike = state.bikes[0];
    state.form = state.bikeDrafts[nextBike] ? { ...state.bikeDrafts[nextBike] } : createBikeDraft(nextBike);
  } else {
    state.form = createBikeDraft("__custom__");
  }
  saveStorage();
  render();
}

function saveSetup() {
  const bikeName = getResolvedBike().trim();
  if (!bikeName) return;
  const analysis = getSetupAnalysis(state.form);
  const entry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    bike: bikeName,
    track: state.form.track.trim(),
    surface: state.form.surface,
    weather: state.form.weather,
    forkCompression: state.form.forkCompression,
    forkRebound: state.form.forkRebound,
    shockHigh: state.form.shockHigh,
    shockLow: state.form.shockLow,
    shockRebound: state.form.shockRebound,
    sag: state.form.sag,
    notes: state.form.notes.trim(),
    derivedSurface: analysis.surfaceLabel,
    derivedWeather: analysis.weatherLabel,
    derivedX: analysis.x,
    derivedY: analysis.y
  };
  state.setups.unshift(entry);
  state.selectedTrack = entry.track || "Ohne Strecke";
  saveStorage();
  render();
}

function loadSetup(entryId) {
  const entry = state.setups.find(item => item.id === entryId);
  if (!entry) return;
  state.form = {
    bike: state.bikes.includes(entry.bike) ? entry.bike : "__custom__",
    bikeCustom: state.bikes.includes(entry.bike) ? "" : entry.bike,
    track: entry.track,
    surface: entry.surface || "mixed",
    weather: entry.weather || "damp",
    forkCompression: entry.forkCompression,
    forkRebound: entry.forkRebound,
    shockHigh: entry.shockHigh,
    shockLow: entry.shockLow,
    shockRebound: entry.shockRebound,
    sag: entry.sag,
    notes: entry.notes
  };
  state.selectedTrack = entry.track?.trim() || "Ohne Strecke";
  persistActiveDraft();
  render();
}

function deleteSetup(entryId) {
  state.setups = state.setups.filter(entry => entry.id !== entryId);
  saveStorage();
  render();
}

function resetBikeDraft() {
  state.form = createBikeDraft(state.form.bike);
  persistActiveDraft();
  render();
}

function bindForm() {
  $("track").addEventListener("input", e => { state.form.track = e.target.value; persistActiveDraft(); renderSummaryOnly(); renderTrackSections(); });
  $("bikeCustom").addEventListener("input", e => { state.form.bikeCustom = e.target.value; persistActiveDraft(); render(); });
  $("surface").addEventListener("change", e => { state.form.surface = e.target.value; persistActiveDraft(); });
  $("weather").addEventListener("change", e => { state.form.weather = e.target.value; persistActiveDraft(); });
  $("shockHigh").addEventListener("change", e => { state.form.shockHigh = e.target.value; persistActiveDraft(); renderAnalysis(); renderSummaryOnly(); });
  $("sag").addEventListener("input", e => { state.form.sag = clamp(e.target.value, 80, 130); persistActiveDraft(); renderAnalysis(); renderSummaryOnly(); e.target.value = state.form.sag; });
  $("notes").addEventListener("input", e => { state.form.notes = e.target.value; persistActiveDraft(); });
  $("addBikeBtn").addEventListener("click", addBike);
  $("deleteBikeBtn").addEventListener("click", deleteBike);
  $("saveSetupBtn").addEventListener("click", saveSetup);
  $("resetBikeBtn").addEventListener("click", resetBikeDraft);
  $("symptomSelect").addEventListener("change", e => { state.selectedSymptom = e.target.value; renderSymptomTips(); });
}

function createSliderCard({ label, key, min = 0, max = 22 }) {
  const value = state.form[key];
  const pct = ((value - min) / (max - min)) * 100;
  const wrapper = document.createElement("div");
  wrapper.className = "slider-card";
  wrapper.innerHTML = `
    <div class="slider-head">
      <strong>${label}</strong>
      <div class="slider-value-box">
        <input type="number" min="${min}" max="${max}" value="${value}" />
        <span class="subtle small">Clicks</span>
      </div>
    </div>
    <input type="range" min="${min}" max="${max}" step="1" value="${value}" />
    <div class="slider-track-visual">
      <div class="slider-line"></div>
      <div class="slider-marker" style="left:${pct}%"></div>
      <div class="slider-scale"><span>${min}</span><span class="current">${value}</span><span>${max}</span></div>
    </div>
  `;
  const numberInput = wrapper.querySelector('input[type="number"]');
  const rangeInput = wrapper.querySelector('input[type="range"]');
  const setValue = next => {
    state.form[key] = clamp(next, min, max);
    persistActiveDraft();
    render();
  };
  numberInput.addEventListener("input", e => setValue(e.target.value));
  rangeInput.addEventListener("input", e => setValue(e.target.value));
  return wrapper;
}

function renderBikeTiles() {
  const container = $("bikeTiles");
  container.innerHTML = "";
  const bikes = [...state.bikes, "__custom__"];
  bikes.forEach(bike => {
    const isCustom = bike === "__custom__";
    const active = state.form.bike === bike;
    const el = document.createElement("button");
    el.className = `bike-tile ${active ? "active" : ""}`;
    el.innerHTML = `
      <div class="bike-tile-top">
        <div class="bike-icon">${isCustom ? "＋" : "🏍️"}</div>
        ${active ? '<span class="pill pill-primary">Aktiv</span>' : ""}
      </div>
      <div class="bike-tile-title">${isCustom ? "Eigenes Bike" : bike}</div>
      <div class="bike-tile-subtitle">${isCustom ? "Neues Motorrad anlegen" : "Setup laden und bearbeiten"}</div>
    `;
    el.addEventListener("click", () => switchBike(bike));
    container.appendChild(el);
  });
}

function renderSummaryOnly() {
  const analysis = getSetupAnalysis(state.form);
  const resolvedBike = getResolvedBike() || "Kein Motorrad";
  $("activeBikeBadge").textContent = resolvedBike;
  $("summaryBike").textContent = resolvedBike;
  $("activeBikeName").textContent = resolvedBike;
  $("summarySurface").textContent = setupLabel(analysis.surfaceLabel, analysis.weatherLabel);
  $("summaryTrack").textContent = state.form.track.trim() || "Ohne Strecke";
  $("deleteBikeBtn").style.display = state.form.bike === "__custom__" ? "none" : "inline-flex";
  $("customBikeField").classList.toggle("hidden", state.form.bike !== "__custom__");

  const stats = [
    ["Gabel Comp.", state.form.forkCompression],
    ["Gabel Reb.", state.form.forkRebound],
    ["Shock High", state.form.shockHigh],
    ["Shock Low", state.form.shockLow],
    ["Shock Reb.", state.form.shockRebound],
    ["Sag", `${state.form.sag} mm`]
  ];
  $("summaryStats").innerHTML = stats.map(([label, value]) => `<div class="summary-stat"><div class="label">${label}</div><div class="value">${value}</div></div>`).join("");
}

function renderAnalysis() {
  const analysis = getSetupAnalysis(state.form);
  $("mapDot").style.left = `${analysis.x}%`;
  $("mapDot").style.top = `${analysis.y}%`;
  $("analysisSurfaceLabel").textContent = analysis.surfaceLabel;
  $("analysisWeatherLabel").textContent = analysis.weatherLabel;
  $("analysisConfidence").textContent = `Treffer ${analysis.confidence}%`;
  $("analysisSurfaceMini").textContent = analysis.surfaceLabel;
  $("analysisWeatherMini").textContent = analysis.weatherLabel;
  $("analysisFirmness").textContent = `${analysis.firmness}%`;
  $("analysisHoldUp").textContent = `${analysis.holdUp}%`;
  $("analysisReasons").innerHTML = analysis.reasons.length ? analysis.reasons.map(reason => `<span class="tag">${reason}</span>`).join("") : '<span class="tag">Aktuell eher neutrales Basis-Setup.</span>';
}

function renderTrackSections() {
  const tracks = getBikeTracks();
  const filterRow = $("trackFilterRow");
  filterRow.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.className = `btn ${state.selectedTrack === "__all__" ? "btn-primary" : "btn-secondary"}`;
  allBtn.textContent = "Alle Strecken";
  allBtn.addEventListener("click", () => { state.selectedTrack = "__all__"; renderTrackSections(); });
  filterRow.appendChild(allBtn);

  tracks.forEach(track => {
    const btn = document.createElement("button");
    btn.className = `btn ${state.selectedTrack === track.name ? "btn-primary" : "btn-secondary"}`;
    btn.textContent = `${track.name} (${track.count})`;
    btn.addEventListener("click", () => { state.selectedTrack = track.name; renderTrackSections(); });
    filterRow.appendChild(btn);
  });

  const list = $("trackList");
  list.innerHTML = "";
  if (!tracks.length) {
    list.innerHTML = '<div class="track-item"><div class="track-meta">Für dieses Bike gibt es noch keine gespeicherten Strecken-Setups.</div></div>';
  } else {
    tracks.forEach(track => {
      const item = document.createElement("button");
      item.className = `track-item ${state.selectedTrack === track.name ? "active" : ""}`;
      item.innerHTML = `
        <div class="track-top">
          <div class="track-left">
            <div class="track-icon">📁</div>
            <div>
              <div><strong>${track.name}</strong></div>
              <div class="track-meta">${track.count} gespeicherte Setups</div>
            </div>
          </div>
          <div class="track-meta">${new Date(track.latest).toLocaleDateString("de-DE")}</div>
        </div>
      `;
      item.addEventListener("click", () => { state.selectedTrack = track.name; renderTrackSections(); });
      list.appendChild(item);
    });
  }

  const setups = getVisibleSetups();
  const saved = $("savedSetups");
  saved.innerHTML = "";
  if (!setups.length) {
    saved.innerHTML = `<div class="setup-item"><div class="track-meta">Keine Setups für diese Auswahl gespeichert.</div></div>`;
  } else {
    setups.forEach(entry => {
      const item = document.createElement("div");
      item.className = "setup-item";
      item.innerHTML = `
        <div class="setup-top">
          <div>
            <div><strong>${entry.track || "Ohne Strecke"}</strong></div>
            <div class="setup-meta">${new Date(entry.createdAt).toLocaleDateString("de-DE")} · ${setupLabel(entry.derivedSurface || "—", entry.derivedWeather || "—")}</div>
          </div>
        </div>
        <div class="setup-values">
          <div>Fork Comp.: <strong>${entry.forkCompression}</strong></div>
          <div>Fork Reb.: <strong>${entry.forkRebound}</strong></div>
          <div>Shock High: <strong>${entry.shockHigh}</strong></div>
          <div>Shock Low: <strong>${entry.shockLow}</strong></div>
          <div>Shock Reb.: <strong>${entry.shockRebound}</strong></div>
          <div>Sag: <strong>${entry.sag} mm</strong></div>
        </div>
        ${entry.notes ? `<div class="setup-meta" style="margin-top:10px;">${entry.notes}</div>` : ""}
        <div class="setup-actions">
          <button class="btn btn-secondary load-btn">Laden</button>
          <button class="btn btn-danger delete-btn">Löschen</button>
        </div>
      `;
      item.querySelector(".load-btn").addEventListener("click", () => loadSetup(entry.id));
      item.querySelector(".delete-btn").addEventListener("click", () => deleteSetup(entry.id));
      saved.appendChild(item);
    });
  }
}

function renderSymptomTips() {
  const symptom = SYMPTOM_GUIDE[state.selectedSymptom];
  $("symptomSelect").value = state.selectedSymptom;
  $("symptomTips").innerHTML = symptom.tips.map(tip => `<div class="tip-item">${tip}</div>`).join("");
}

function renderFormControls() {
  $("track").value = state.form.track;
  $("bikeCustom").value = state.form.bikeCustom;
  $("surface").value = state.form.surface;
  $("weather").value = state.form.weather;
  $("shockHigh").value = state.form.shockHigh;
  $("sag").value = state.form.sag;
  $("notes").value = state.form.notes;

  const fork = $("forkSliders");
  fork.innerHTML = "";
  fork.appendChild(createSliderCard({ label: "Compression", key: "forkCompression" }));
  fork.appendChild(createSliderCard({ label: "Rebound", key: "forkRebound" }));

  const shock = $("shockSliders");
  shock.innerHTML = "";
  shock.appendChild(createSliderCard({ label: "Lowspeed Compression", key: "shockLow" }));
  shock.appendChild(createSliderCard({ label: "Rebound", key: "shockRebound" }));
}

function renderSymptomSelect() {
  const select = $("symptomSelect");
  select.innerHTML = Object.entries(SYMPTOM_GUIDE).map(([key, value]) => `<option value="${key}">${value.label}</option>`).join("");
  select.value = state.selectedSymptom;
}

function render() {
  persistActiveDraft();
  renderBikeTiles();
  renderFormControls();
  renderSummaryOnly();
  renderAnalysis();
  renderTrackSections();
  renderSymptomSelect();
  renderSymptomTips();
}

runSanityChecks();
loadStorage();
bindForm();
render();
