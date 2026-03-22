const STORAGE_KEY = "mx-suspension-tool-github-v3";

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
      "Die Tipps sind bewusst kurz gehalten und sollen später durch fahrzeugspezifische Regeln ergänzt werden.",
    ],
  },
  turn_in: {
    label: "Lenkt schlecht ein",
    tips: [
      "Gabel leicht durchschieben, damit mehr Last aufs Vorderrad kommt.",
      "Vorn etwas weicher oder hinten leicht höher beziehungsweise weniger Sag prüfen.",
      "Reifendruck und Reifenbild immer mitdenken, nicht nur Clicks ändern.",
    ],
  },
  front_sand_push: {
    label: "Vorderrad rutscht im Sand weg",
    tips: [
      "Setup tendenziell etwas Richtung Hartboden verschieben, damit das Vorderrad besser führt.",
      "Die Gabel nicht unnötig weich abstimmen, damit das Vorderrad mehr Support hat.",
      "Zusätzlich Fahrerposition und Last auf dem Vorderrad prüfen.",
    ],
  },
  rear_kick: {
    label: "Heck kickt über Kanten",
    tips: [
      "Shock-Rebound prüfen. Oft etwas schneller öffnen lassen, wenn das Heck stehen bleibt und dann schlägt.",
      "High-Speed hinten nicht zu straff fahren, wenn harte Schläge das Bike aushebeln.",
      "Sag kontrollieren, weil ein unpassender Grundstand viele Symptome verfälscht.",
    ],
  },
  harsh_front: {
    label: "Vorne hart oder unruhig",
    tips: [
      "Gabel-Compression etwas öffnen und prüfen, ob kleine Schläge besser gefiltert werden.",
      "Zu langsamer Rebound kann die Gabel packen lassen. Rebound nicht nur bei Compression anschauen.",
      "Servicezustand und Ölstand der Gabel später ebenfalls erfassen.",
    ],
  },
  lazy_rear: {
    label: "Heck schwammig oder träge",
    tips: [
      "Weniger Sag oder etwas mehr Low-Speed hinten testen.",
      "Zu weiche Basis hinten kann das Bike in langen Kurven breit machen.",
      "Nur kleine Schritte ändern und danach direkt eine kurze Vergleichsrunde fahren.",
    ],
  },
};

const state = {
  bikes: [...DEFAULT_BIKES],
  bikeDrafts: {},
  setups: [],
  form: { ...INITIAL_FORM },
  selectedTrack: "__all__",
  selectedSymptom: "neutral",
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function clampFloat(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function getHighspeedNumeric(value) {
  if (value === "n.v.") return 1.5;
  return clampFloat(value, 0.5, 3.0);
}

function createBikeDraft(bikeName) {
  return {
    ...INITIAL_FORM,
    bike: bikeName,
    bikeCustom: bikeName === "__custom__" ? "" : "",
  };
}

function resolvedBikeName() {
  return state.form.bike === "__custom__"
    ? state.form.bikeCustom.trim()
    : state.form.bike;
}

function activeBikeKey() {
  if (state.form.bike === "__custom__") {
    const name = state.form.bikeCustom.trim();
    return name ? `custom:${name}` : "__custom__";
  }
  return state.form.bike;
}

function mapWeatherLabel(score) {
  if (score <= 24) return "Nass";
  if (score <= 42) return "Feucht";
  if (score <= 60) return "Neutral";
  if (score <= 78) return "Trocken";
  return "Sehr trocken";
}

function mapSurfaceLabel(score) {
  if (score <= 22) return "Hartboden";
  if (score <= 40) return "Hart/Misch";
  if (score <= 60) return "Mischboden";
  if (score <= 78) return "Lehmig";
  return "Sand";
}

function getSetupAnalysis(form) {
  const forkCompNorm = form.forkCompression / 22;
  const forkRebNorm = form.forkRebound / 22;
  const shockLowNorm = form.shockLow / 22;
  const shockRebNorm = form.shockRebound / 22;
  const shockHighNorm = (getHighspeedNumeric(form.shockHigh) - 0.5) / 2.5;
  const sagNorm = (clamp(form.sag, 90, 120) - 90) / 30;

  const frontFirmness =
    forkCompNorm * 0.55 + forkRebNorm * 0.25 + (1 - sagNorm) * 0.2;
  const rearFirmness =
    shockLowNorm * 0.45 +
    shockHighNorm * 0.3 +
    shockRebNorm * 0.15 +
    (1 - sagNorm) * 0.1;
  const overallFirmness = frontFirmness * 0.52 + rearFirmness * 0.48;

  const holdUpBias =
    (1 - sagNorm) * 0.45 +
    shockHighNorm * 0.2 +
    shockLowNorm * 0.15 +
    forkRebNorm * 0.1 +
    shockRebNorm * 0.1;

  const plushBias =
    sagNorm * 0.4 +
    (1 - shockHighNorm) * 0.2 +
    (1 - shockLowNorm) * 0.2 +
    (1 - forkCompNorm) * 0.2;

  const cornerBias =
    forkCompNorm * 0.3 +
    forkRebNorm * 0.18 +
    (1 - sagNorm) * 0.22 +
    (1 - shockHighNorm) * 0.08 +
    (1 - shockLowNorm) * 0.1 +
    (1 - shockRebNorm) * 0.12;

  const stabilityBias =
    shockHighNorm * 0.22 +
    shockLowNorm * 0.22 +
    shockRebNorm * 0.18 +
    sagNorm * 0.18 +
    forkCompNorm * 0.1 +
    forkRebNorm * 0.1;

  const x = clamp(
    Math.round(50 + (stabilityBias - cornerBias) * 55 + (overallFirmness - 0.5) * 18),
    10,
    90
  );
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
    x,
    y,
    surfaceLabel: mapSurfaceLabel(x),
    weatherLabel: mapWeatherLabel(y),
    confidence: Math.round(
      58 + Math.abs(overallFirmness - 0.5) * 45 + Math.abs(holdUpBias - plushBias) * 15
    ),
    reasons: reasons.slice(0, 5),
  };
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      bikes: state.bikes,
      bikeDrafts: state.bikeDrafts,
      setups: state.setups,
    })
  );
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    state.form = { ...INITIAL_FORM };
    state.bikeDrafts[state.form.bike] = { ...state.form };
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.bikes)) state.bikes = parsed.bikes;
    if (parsed.bikeDrafts && typeof parsed.bikeDrafts === "object") {
      state.bikeDrafts = parsed.bikeDrafts;
    }
    if (Array.isArray(parsed.setups)) state.setups = parsed.setups;
  } catch (error) {
    console.warn("Speicher konnte nicht geladen werden", error);
  }

  const firstBike = state.bikes[0] || "__custom__";
  state.form = state.bikeDrafts[firstBike]
    ? { ...state.bikeDrafts[firstBike] }
    : createBikeDraft(firstBike);
}

function syncDraft() {
  state.bikeDrafts[activeBikeKey()] = { ...state.form };
  saveState();
}

function switchBike(bikeName) {
  state.selectedTrack = "__all__";
  const draft = state.bikeDrafts[bikeName];
  state.form = draft ? { ...draft } : createBikeDraft(bikeName);
  render();
}

function deleteBike() {
  const bikeName = resolvedBikeName();
  if (!bikeName || state.form.bike === "__custom__") return;

  const confirmed = window.confirm(
    `Motorrad "${bikeName}" inklusive zugehöriger gespeicherter Setups löschen?`
  );
  if (!confirmed) return;

  state.bikes = state.bikes.filter((b) => b !== bikeName);
  state.setups = state.setups.filter((s) => s.bike !== bikeName);
  delete state.bikeDrafts[bikeName];

  const nextBike = state.bikes[0] || "__custom__";
  state.form = state.bikeDrafts[nextBike]
    ? { ...state.bikeDrafts[nextBike] }
    : createBikeDraft(nextBike);

  state.selectedTrack = "__all__";
  saveState();
  render();
}

function addBike() {
  const input = document.getElementById("newBikeInput");
  const name = input.value.trim();
  if (!name) return;

  if (!state.bikes.includes(name)) {
    state.bikes.push(name);
    state.bikeDrafts[name] = createBikeDraft(name);
  }

  input.value = "";
  switchBike(name);
}

function currentBikeSetups() {
  const bike = resolvedBikeName();
  if (!bike) return [];
  return state.setups.filter((entry) => entry.bike === bike);
}

function currentVisibleSetups() {
  const setups = currentBikeSetups();
  if (state.selectedTrack === "__all__") return setups;
  return setups.filter(
    (entry) => ((entry.track || "").trim() || "Ohne Strecke") === state.selectedTrack
  );
}

function groupedTracks() {
  const map = new Map();
  currentBikeSetups().forEach((entry) => {
    const key = (entry.track || "").trim() || "Ohne Strecke";
    if (!map.has(key)) {
      map.set(key, { name: key, count: 0, latest: entry.createdAt });
    }
    const current = map.get(key);
    current.count += 1;
    if (new Date(entry.createdAt) > new Date(current.latest)) {
      current.latest = entry.createdAt;
    }
  });
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.latest) - new Date(a.latest)
  );
}

function saveSetup() {
  const bikeName = resolvedBikeName();
  if (!bikeName) {
    alert("Bitte zuerst ein Motorrad wählen oder eingeben.");
    return;
  }

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
    derivedY: analysis.y,
  };

  state.setups.unshift(entry);
  state.selectedTrack = entry.track || "Ohne Strecke";
  saveState();
  render();
}

function loadSetup(entryId) {
  const entry = state.setups.find((s) => s.id === entryId);
  if (!entry) return;

  if (!state.bikes.includes(entry.bike) && entry.bike) {
    state.form.bike = "__custom__";
    state.form.bikeCustom = entry.bike;
  } else {
    state.form.bike = entry.bike;
    state.form.bikeCustom = "";
  }

  state.form.track = entry.track || "";
  state.form.surface = entry.surface || "mixed";
  state.form.weather = entry.weather || "damp";
  state.form.forkCompression = entry.forkCompression;
  state.form.forkRebound = entry.forkRebound;
  state.form.shockHigh = entry.shockHigh;
  state.form.shockLow = entry.shockLow;
  state.form.shockRebound = entry.shockRebound;
  state.form.sag = entry.sag;
  state.form.notes = entry.notes || "";

  state.selectedTrack = entry.track || "Ohne Strecke";
  syncDraft();
  render();
}

function deleteSetup(entryId) {
  state.setups = state.setups.filter((s) => s.id !== entryId);
  saveState();
  render();
}

function resetBike() {
  const bike = state.form.bike;
  state.form = createBikeDraft(bike);
  state.selectedTrack = "__all__";
  syncDraft();
  render();
}

function bindField(id, key, parser = (v) => v) {
  const el = document.getElementById(id);
  el.addEventListener("input", (e) => {
    state.form[key] = parser(e.target.value);
    syncDraft();
    render();
  });
  el.addEventListener("change", (e) => {
    state.form[key] = parser(e.target.value);
    syncDraft();
    render();
  });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderBikeCards() {
  const container = document.getElementById("bikeCards");
  container.innerHTML = "";

  state.bikes.forEach((bike) => {
    const active = state.form.bike === bike;
    const card = document.createElement("button");
    card.className = `bike-card${active ? " active" : ""}`;
    card.type = "button";
    card.innerHTML = `
      <div class="bike-card-top">
        <div class="bike-icon">🏍</div>
        ${active ? '<span class="active-badge">Aktiv</span>' : ""}
      </div>
      <div class="bike-name">${bike}</div>
      <div class="bike-sub">Setup laden und bearbeiten</div>
    `;
    card.addEventListener("click", () => switchBike(bike));
    container.appendChild(card);
  });

  const customCard = document.createElement("button");
  customCard.className = `bike-card${state.form.bike === "__custom__" ? " active" : ""}`;
  customCard.type = "button";
  customCard.innerHTML = `
    <div class="bike-card-top">
      <div class="bike-icon">＋</div>
      ${state.form.bike === "__custom__" ? '<span class="active-badge">Aktiv</span>' : ""}
    </div>
    <div class="bike-name">Eigenes Bike</div>
    <div class="bike-sub">Neues Motorrad anlegen</div>
  `;
  customCard.addEventListener("click", () => switchBike("__custom__"));
  container.appendChild(customCard);
}

function renderSummary(analysis) {
  const bikeName = resolvedBikeName() || "Kein Motorrad";
  setText("sidebarActiveBike", bikeName);
  setText("heroBikePill", bikeName);
  setText("summaryBike", bikeName);
  setText("activeBikeLabel", bikeName);

  setText("summaryRange", `${analysis.surfaceLabel} · ${analysis.weatherLabel}`);
  setText("summaryTrack", state.form.track || "–");
  setText("summarySag", `${state.form.sag} mm`);
  setText("summaryFork", `C ${state.form.forkCompression} · R ${state.form.forkRebound}`);
  setText("summaryShock", `L ${state.form.shockLow} · R ${state.form.shockRebound}`);
  setText("summaryHigh", state.form.shockHigh);

  document.getElementById("deleteBikeBtn").style.display =
    state.form.bike === "__custom__" ? "none" : "inline-flex";

  document.getElementById("customBikeWrap").classList.toggle(
    "hidden",
    state.form.bike !== "__custom__"
  );
}

function renderFields() {
  document.getElementById("trackInput").value = state.form.track;
  document.getElementById("surfaceSelect").value = state.form.surface;
  document.getElementById("weatherSelect").value = state.form.weather;
  document.getElementById("shockHighSelect").value = state.form.shockHigh;
  document.getElementById("sagInput").value = state.form.sag;
  document.getElementById("notesInput").value = state.form.notes;
  document.getElementById("customBikeInput").value = state.form.bikeCustom;

  document.getElementById("forkCompNumber").value = state.form.forkCompression;
  document.getElementById("forkCompRange").value = state.form.forkCompression;
  document.getElementById("forkRebNumber").value = state.form.forkRebound;
  document.getElementById("forkRebRange").value = state.form.forkRebound;
  document.getElementById("shockLowNumber").value = state.form.shockLow;
  document.getElementById("shockLowRange").value = state.form.shockLow;
  document.getElementById("shockRebNumber").value = state.form.shockRebound;
  document.getElementById("shockRebRange").value = state.form.shockRebound;

  setText("forkCompValue", state.form.forkCompression);
  setText("forkCompBadge", state.form.forkCompression);
  setText("forkRebValue", state.form.forkRebound);
  setText("forkRebBadge", state.form.forkRebound);
  setText("shockLowValue", state.form.shockLow);
  setText("shockLowBadge", state.form.shockLow);
  setText("shockRebValue", state.form.shockRebound);
  setText("shockRebBadge", state.form.shockRebound);
  setText("shockHighValue", state.form.shockHigh);

  setText("forkOverview", `Comp ${state.form.forkCompression} · Reb ${state.form.forkRebound}`);
  setText(
    "shockOverview",
    `Low ${state.form.shockLow} · Reb ${state.form.shockRebound} · High ${state.form.shockHigh}`
  );
}

function renderAnalysis(analysis) {
  const dot = document.getElementById("terrainDot");
  dot.style.left = `${analysis.x}%`;
  dot.style.top = `${analysis.y}%`;

  setText("analysisSurface", analysis.surfaceLabel);
  setText("analysisWeather", analysis.weatherLabel);
  setText("analysisConfidence", `${analysis.confidence}%`);

  const wrap = document.getElementById("analysisReasons");
  wrap.innerHTML = "";

  if (analysis.reasons.length === 0) {
    const empty = document.createElement("span");
    empty.className = "meta";
    empty.textContent = "Aktuell eher neutrales Basis-Setup.";
    wrap.appendChild(empty);
    return;
  }

  analysis.reasons.forEach((reason) => {
    const chip = document.createElement("span");
    chip.className = "reason-chip";
    chip.textContent = reason;
    wrap.appendChild(chip);
  });
}

function renderTracks() {
  const list = document.getElementById("tracksList");
  list.innerHTML = "";

  const tracks = groupedTracks();

  if (tracks.length === 0) {
    list.innerHTML = `<div class="empty-state">Für dieses Bike gibt es noch keine gespeicherten Strecken-Setups.</div>`;
    return;
  }

  tracks.forEach((track) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `track-item${state.selectedTrack === track.name ? " active" : ""}`;
    item.innerHTML = `
      <div class="track-item-row">
        <div>
          <div class="track-name">${track.name}</div>
          <div class="meta">${track.count} gespeicherte Setups</div>
        </div>
        <div class="meta">${new Date(track.latest).toLocaleDateString("de-DE")}</div>
      </div>
    `;
    item.addEventListener("click", () => {
      state.selectedTrack = track.name;
      render();
    });
    list.appendChild(item);
  });
}

function renderSymptomGuide() {
  const select = document.getElementById("symptomSelect");
  if (!select.dataset.ready) {
    Object.entries(SYMPTOM_GUIDE).forEach(([key, value]) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = value.label;
      select.appendChild(option);
    });
    select.dataset.ready = "true";
  }

  select.value = state.selectedSymptom;

  const wrap = document.getElementById("symptomTips");
  wrap.innerHTML = "";

  SYMPTOM_GUIDE[state.selectedSymptom].tips.forEach((tip) => {
    const item = document.createElement("div");
    item.className = "tip-item";
    item.textContent = tip;
    wrap.appendChild(item);
  });
}

function renderSetups() {
  const list = document.getElementById("setupsList");
  list.innerHTML = "";

  const setups = currentVisibleSetups();

  if (setups.length === 0) {
    list.innerHTML = `<div class="empty-state">Keine Setups für diese Auswahl gespeichert.</div>`;
    return;
  }

  setups.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "setup-item";
    item.innerHTML = `
      <div class="setup-item-row">
        <div>
          <div class="setup-name">${entry.track || "Ohne Strecke"}</div>
          <div class="meta">
            ${new Date(entry.createdAt).toLocaleDateString("de-DE")} ·
            ${entry.derivedSurface || "–"} · ${entry.derivedWeather || "–"}
          </div>
        </div>
        <div class="row-actions">
          <button class="btn btn-small btn-secondary" data-action="load">Laden</button>
          <button class="btn btn-small btn-danger" data-action="delete">Löschen</button>
        </div>
      </div>
      ${
        entry.notes
          ? `<div class="meta" style="margin-top:10px;">${entry.notes}</div>`
          : ""
      }
    `;

    item.querySelector('[data-action="load"]').addEventListener("click", () => loadSetup(entry.id));
    item.querySelector('[data-action="delete"]').addEventListener("click", () => deleteSetup(entry.id));
    list.appendChild(item);
  });
}

function render() {
  const analysis = getSetupAnalysis(state.form);
  renderBikeCards();
  renderSummary(analysis);
  renderFields();
  renderAnalysis(analysis);
  renderTracks();
  renderSymptomGuide();
  renderSetups();
  saveState();
}

function bindAccordion() {
  document.querySelectorAll(".accordion-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.closest(".accordion").classList.toggle("open");
    });
  });
}

function bindField(id, key, parser = (v) => v) {
  const el = document.getElementById(id);
  el.addEventListener("input", (e) => {
    state.form[key] = parser(e.target.value);
    syncDraft();
    render();
  });
  el.addEventListener("change", (e) => {
    state.form[key] = parser(e.target.value);
    syncDraft();
    render();
  });
}

function bindEvents() {
  document.getElementById("addBikeBtn").addEventListener("click", addBike);
  document.getElementById("deleteBikeBtn").addEventListener("click", deleteBike);
  document.getElementById("saveSetupBtn").addEventListener("click", saveSetup);
  document.getElementById("resetBikeBtn").addEventListener("click", resetBike);
  document.getElementById("allTracksBtn").addEventListener("click", () => {
    state.selectedTrack = "__all__";
    render();
  });

  bindField("trackInput", "track", (v) => v);
  bindField("surfaceSelect", "surface", (v) => v);
  bindField("weatherSelect", "weather", (v) => v);
  bindField("shockHighSelect", "shockHigh", (v) => v);
  bindField("sagInput", "sag", (v) => clamp(v, 80, 130));
  bindField("notesInput", "notes", (v) => v);

  document.getElementById("customBikeInput").addEventListener("input", (e) => {
    state.form.bikeCustom = e.target.value;
    syncDraft();
    render();
  });

  [
    ["forkCompNumber", "forkCompRange", "forkCompression"],
    ["forkRebNumber", "forkRebRange", "forkRebound"],
    ["shockLowNumber", "shockLowRange", "shockLow"],
    ["shockRebNumber", "shockRebRange", "shockRebound"],
  ].forEach(([numberId, rangeId, key]) => {
    const numberEl = document.getElementById(numberId);
    const rangeEl = document.getElementById(rangeId);

    const update = (value) => {
      state.form[key] = clamp(value, 0, 22);
      syncDraft();
      render();
    };

    numberEl.addEventListener("input", (e) => update(e.target.value));
    rangeEl.addEventListener("input", (e) => update(e.target.value));
  });

  document.getElementById("symptomSelect").addEventListener("change", (e) => {
    state.selectedSymptom = e.target.value;
    render();
  });

  bindAccordion();
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

  const stiff = getSetupAnalysis({
    ...INITIAL_FORM,
    forkCompression: 22,
    forkRebound: 22,
    shockLow: 22,
    shockRebound: 22,
    shockHigh: "3.0",
    sag: 90,
  });
  console.assert(stiff.x >= neutral.x, "stiff setup should not move left of neutral unexpectedly");
}

document.addEventListener("DOMContentLoaded", () => {
  runSanityChecks();
  loadState();
  bindEvents();
  render();
});
