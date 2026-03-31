const STORAGE_KEY = "mx-suspension-clean-v1";
const GARAGE_URL = "https://solidsnake2070.github.io/Garage-Tool/";

const DEFAULT_BIKES = ["KX250F", "KX85", "KTM 65 SX", "SX-F 250"];
const CONDITIONS = ["trocken", "nass", "feucht"];

const DEFAULT_BIKE_CONFIG = {
  forkPressureMax: 22,
  forkReboundMax: 22,
  shockSeparate: false,
  shockPressureMax: 22,
  shockLowMax: 22,
  shockReboundMax: 22,
};

const DEFAULT_SETUP = {
  forkPressure: 12,
  forkRebound: 12,
  shockPressure: 12,
  shockHigh: "1.5",
  shockLow: 12,
  shockRebound: 12,
  forkHeight: 0,
  notes: "",
};

const state = {
  bikes: [...DEFAULT_BIKES],
  tracksByBike: {},
  bikeConfigs: {},
  selectedBike: DEFAULT_BIKES[0],
  selectedTrack: "",
  selectedCondition: "",
  setups: {},
};

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function clamp(value, min, max) {
  const n = Number(value);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function getSetupKey(bike, track, condition) {
  return `${bike}__${track}__${condition}`;
}

function ensureBikeExists(bike) {
  if (!bike) return;
  if (!state.tracksByBike[bike]) state.tracksByBike[bike] = [];
  if (!state.bikeConfigs[bike]) state.bikeConfigs[bike] = deepCopy(DEFAULT_BIKE_CONFIG);
  if (!state.bikes.includes(bike)) state.bikes.push(bike);
}

function currentSetupKey() {
  if (!state.selectedBike || !state.selectedTrack || !state.selectedCondition) return null;
  return getSetupKey(state.selectedBike, state.selectedTrack, state.selectedCondition);
}

function ensureCurrentSetupExists() {
  const key = currentSetupKey();
  if (!key) return null;
  if (!state.setups[key]) state.setups[key] = deepCopy(DEFAULT_SETUP);
  return key;
}

function getCurrentSetup() {
  const key = ensureCurrentSetupExists();
  if (!key) return deepCopy(DEFAULT_SETUP);
  return state.setups[key];
}

function getCurrentBikeConfig() {
  if (!state.selectedBike) return deepCopy(DEFAULT_BIKE_CONFIG);
  ensureBikeExists(state.selectedBike);
  return state.bikeConfigs[state.selectedBike];
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      bikes: state.bikes,
      tracksByBike: state.tracksByBike,
      bikeConfigs: state.bikeConfigs,
      selectedBike: state.selectedBike,
      selectedTrack: state.selectedTrack,
      selectedCondition: state.selectedCondition,
      setups: state.setups,
    })
  );
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    ensureBikeExists(state.selectedBike);
    return;
  }

  try {
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed.bikes) && parsed.bikes.length) state.bikes = parsed.bikes;
    if (parsed.tracksByBike && typeof parsed.tracksByBike === "object") state.tracksByBike = parsed.tracksByBike;
    if (parsed.bikeConfigs && typeof parsed.bikeConfigs === "object") state.bikeConfigs = parsed.bikeConfigs;
    if (typeof parsed.selectedBike === "string") state.selectedBike = parsed.selectedBike;
    if (typeof parsed.selectedTrack === "string") state.selectedTrack = parsed.selectedTrack;
    if (typeof parsed.selectedCondition === "string") state.selectedCondition = parsed.selectedCondition;
    if (parsed.setups && typeof parsed.setups === "object") state.setups = parsed.setups;
  } catch (e) {
    console.warn("Fehler beim Laden", e);
  }

  state.bikes.forEach((bike) => ensureBikeExists(bike));
  ensureBikeExists(state.selectedBike);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function updateSetupField(field, value) {
  const key = ensureCurrentSetupExists();
  if (!key) return;
  state.setups[key][field] = value;
  saveState();
}

function updateBikeConfig(field, value) {
  if (!state.selectedBike) return;
  ensureBikeExists(state.selectedBike);
  state.bikeConfigs[state.selectedBike][field] = value;
  saveState();
}

function collectSetupFromInputs() {
  const config = getCurrentBikeConfig();

  return {
    forkPressure: clamp(document.getElementById("forkPressureNumber").value, 0, config.forkPressureMax),
    forkRebound: clamp(document.getElementById("forkReboundNumber").value, 0, config.forkReboundMax),
    shockPressure: clamp(document.getElementById("shockPressureNumber").value, 0, config.shockPressureMax),
    shockHigh: document.getElementById("shockHighSelect").value,
    shockLow: clamp(document.getElementById("shockLowNumber").value, 0, config.shockLowMax),
    shockRebound: clamp(document.getElementById("shockReboundNumber").value, 0, config.shockReboundMax),
    forkHeight: clamp(document.getElementById("forkHeightInput").value, 0, 30),
    notes: document.getElementById("notesInput").value || "",
  };
}

function renderBikeCards() {
  const container = document.getElementById("bikeList");
  container.innerHTML = "";

  state.bikes.forEach((bike) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `bike-card${bike === state.selectedBike ? " active" : ""}`;
    card.innerHTML = `
      <div class="bike-card-top">
        <div class="bike-icon">🏍</div>
        ${bike === state.selectedBike ? '<span class="active-badge">Aktiv</span>' : ""}
      </div>
      <div class="bike-name">${bike}</div>
      <div class="bike-sub">Bike auswählen</div>
    `;
    card.addEventListener("click", () => {
      state.selectedBike = bike;
      state.selectedTrack = "";
      state.selectedCondition = "";
      saveState();
      renderAll();
    });
    container.appendChild(card);
  });
}

function renderTracks() {
  const container = document.getElementById("trackList");
  container.innerHTML = "";

  if (!state.selectedBike) return;

  const tracks = state.tracksByBike[state.selectedBike] || [];
  if (!tracks.length) {
    const empty = document.createElement("div");
    empty.className = "track-card";
    empty.textContent = "Noch keine Strecken vorhanden.";
    empty.style.cursor = "default";
    container.appendChild(empty);
    return;
  }

  tracks.forEach((track) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `track-card${track === state.selectedTrack ? " active" : ""}`;
    card.innerHTML = `
      <div class="track-name">${track}</div>
      <div class="track-sub">Strecke auswählen</div>
    `;
    card.addEventListener("click", () => {
      state.selectedTrack = track;
      if (!state.selectedCondition) state.selectedCondition = "trocken";
      ensureCurrentSetupExists();
      saveState();
      renderAll();
    });
    container.appendChild(card);
  });
}

function renderConditions() {
  const enabled = Boolean(state.selectedBike && state.selectedTrack);

  document.querySelectorAll(".condition-btn").forEach((btn) => {
    const condition = btn.dataset.condition;
    btn.classList.toggle("active", condition === state.selectedCondition);
    btn.disabled = !enabled;
    btn.style.opacity = enabled ? "1" : "0.45";
    btn.style.pointerEvents = enabled ? "auto" : "none";
  });
}

function renderSummary() {
  const setup = getCurrentSetup();
  const config = getCurrentBikeConfig();

  const bike = state.selectedBike || "–";
  const track = state.selectedTrack || "–";
  const condition = state.selectedCondition || "–";

  setText("sidebarStatus", `${bike} / ${track} / ${condition}`);
  setText("heroPill", bike);
  setText("summaryBike", bike);
  setText("summaryTrack", track);
  setText("summaryCondition", condition);

  const context =
    state.selectedBike && state.selectedTrack && state.selectedCondition
      ? `${state.selectedBike} · ${state.selectedTrack} · ${state.selectedCondition}`
      : "Bitte Bike, Strecke und Bedingung wählen";

  setText("setupContext", context);
  setText("forkOverview", `Druckstufe ${setup.forkPressure} · Zugstufe ${setup.forkRebound}`);

  if (config.shockSeparate) {
    setText(
      "shockOverview",
      `Low-Speed ${setup.shockLow} · Zugstufe ${setup.shockRebound} · High-Speed ${setup.shockHigh}`
    );
  } else {
    setText(
      "shockOverview",
      `Druckstufe ${setup.shockPressure} · Zugstufe ${setup.shockRebound}`
    );
  }
}

function setSliderGroup(rangeId, numberId, valueId, badgeId, maxId, maxLabelId, value, max) {
  const range = document.getElementById(rangeId);
  const number = document.getElementById(numberId);
  const maxInput = document.getElementById(maxId);

  range.max = max;
  number.max = max;
  maxInput.value = max;

  range.value = value;
  number.value = value;

  setText(valueId, value);
  setText(badgeId, value);
  setText(maxLabelId, max);
}

function renderSetup() {
  const setup = getCurrentSetup();
  const config = getCurrentBikeConfig();

  setSliderGroup(
    "forkPressureRange",
    "forkPressureNumber",
    "forkPressureValue",
    "forkPressureBadge",
    "forkPressureMax",
    "forkPressureMaxLabel",
    setup.forkPressure,
    config.forkPressureMax
  );

  setSliderGroup(
    "forkReboundRange",
    "forkReboundNumber",
    "forkReboundValue",
    "forkReboundBadge",
    "forkReboundMax",
    "forkReboundMaxLabel",
    setup.forkRebound,
    config.forkReboundMax
  );

  document.getElementById("separateHighLow").checked = !!config.shockSeparate;

  setSliderGroup(
    "shockPressureRange",
    "shockPressureNumber",
    "shockPressureValue",
    "shockPressureBadge",
    "shockPressureMax",
    "shockPressureMaxLabel",
    setup.shockPressure,
    config.shockPressureMax
  );

  setSliderGroup(
    "shockLowRange",
    "shockLowNumber",
    "shockLowValue",
    "shockLowBadge",
    "shockLowMax",
    "shockLowMaxLabel",
    setup.shockLow,
    config.shockLowMax
  );

  setSliderGroup(
    "shockReboundRange",
    "shockReboundNumber",
    "shockReboundValue",
    "shockReboundBadge",
    "shockReboundMax",
    "shockReboundMaxLabel",
    setup.shockRebound,
    config.shockReboundMax
  );

  document.getElementById("shockHighSelect").value = setup.shockHigh;
  setText("shockHighValue", setup.shockHigh);

  document.getElementById("forkHeightInput").value = setup.forkHeight;
  document.getElementById("notesInput").value = setup.notes;

  document.getElementById("shockSimpleBlock").classList.toggle("hidden", !!config.shockSeparate);
  document.getElementById("shockSeparateBlock").classList.toggle("hidden", !config.shockSeparate);
}

function bindSlider(rangeId, numberId, valueId, badgeId, maxId, maxLabelId, setupField, configField) {
  const range = document.getElementById(rangeId);
  const number = document.getElementById(numberId);
  const maxInput = document.getElementById(maxId);

  function applyValue(rawValue) {
    const max = clamp(maxInput.value, 1, 99);
    const value = clamp(rawValue, 0, max);

    maxInput.value = max;
    range.max = max;
    number.max = max;

    range.value = value;
    number.value = value;

    setText(valueId, value);
    setText(badgeId, value);
    setText(maxLabelId, max);

    updateBikeConfig(configField, max);
    updateSetupField(setupField, value);
    renderSummary();
  }

  range.addEventListener("input", () => applyValue(range.value));
  number.addEventListener("input", () => applyValue(number.value));

  maxInput.addEventListener("input", () => {
    const max = clamp(maxInput.value, 1, 99);
    const value = clamp(number.value, 0, max);

    maxInput.value = max;
    range.max = max;
    number.max = max;

    range.value = value;
    number.value = value;

    setText(valueId, value);
    setText(badgeId, value);
    setText(maxLabelId, max);

    updateBikeConfig(configField, max);
    updateSetupField(setupField, value);
    renderSummary();
  });
}

function bindAccordion() {
  document.querySelectorAll(".accordion-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.target);
      const arrow = btn.querySelector(".accordion-arrow");
      const open = target.classList.contains("open-content");

      target.classList.toggle("open-content", !open);
      arrow.textContent = open ? "⌄" : "⌃";
    });
  });
}

function bindMaxToggles() {
  document.querySelectorAll(".max-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const wrap = document.getElementById(btn.dataset.target);
      wrap.classList.toggle("hidden");
    });
  });
}

function exportJson() {
  const data = {
    bikes: state.bikes,
    tracksByBike: state.tracksByBike,
    bikeConfigs: state.bikeConfigs,
    setups: state.setups,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "suspension-tool-backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importJson(file) {
  const reader = new FileReader();

  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);

      if (Array.isArray(data.bikes)) state.bikes = data.bikes;
      if (data.tracksByBike && typeof data.tracksByBike === "object") state.tracksByBike = data.tracksByBike;
      if (data.bikeConfigs && typeof data.bikeConfigs === "object") state.bikeConfigs = data.bikeConfigs;
      if (data.setups && typeof data.setups === "object") state.setups = data.setups;

      if (!state.bikes.includes(state.selectedBike)) {
        state.selectedBike = state.bikes[0] || "";
        state.selectedTrack = "";
        state.selectedCondition = "";
      }

      state.bikes.forEach((bike) => ensureBikeExists(bike));
      saveState();
      renderAll();
    } catch (e) {
      alert("JSON konnte nicht importiert werden.");
      console.error(e);
    }
  };

  reader.readAsText(file);
}

function bindEvents() {
  document.getElementById("addBikeBtn").addEventListener("click", () => {
    const input = document.getElementById("bikeInput");
    const value = input.value.trim();
    if (!value) return;

    ensureBikeExists(value);
    state.selectedBike = value;
    state.selectedTrack = "";
    state.selectedCondition = "";
    input.value = "";
    saveState();
    renderAll();
  });

  document.getElementById("deleteBikeBtn").addEventListener("click", () => {
    if (!state.selectedBike) return;

    const ok = window.confirm(`Bike "${state.selectedBike}" wirklich löschen?`);
    if (!ok) return;

    const bike = state.selectedBike;
    state.bikes = state.bikes.filter((b) => b !== bike);
    delete state.tracksByBike[bike];
    delete state.bikeConfigs[bike];

    Object.keys(state.setups).forEach((key) => {
      if (key.startsWith(`${bike}__`)) delete state.setups[key];
    });

    state.selectedBike = state.bikes[0] || "";
    state.selectedTrack = "";
    state.selectedCondition = "";

    if (state.selectedBike) ensureBikeExists(state.selectedBike);

    saveState();
    renderAll();
  });

  document.getElementById("addTrackBtn").addEventListener("click", () => {
    if (!state.selectedBike) return;

    const input = document.getElementById("trackInput");
    const value = input.value.trim();
    if (!value) return;

    ensureBikeExists(state.selectedBike);

    if (!state.tracksByBike[state.selectedBike].includes(value)) {
      state.tracksByBike[state.selectedBike].push(value);
    }

    state.selectedTrack = value;
    if (!state.selectedCondition) state.selectedCondition = "trocken";
    ensureCurrentSetupExists();

    input.value = "";
    saveState();
    renderAll();
  });

  document.querySelectorAll(".condition-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedCondition = btn.dataset.condition;
      ensureCurrentSetupExists();
      saveState();
      renderAll();
    });
  });

  document.getElementById("saveSetupBtn").addEventListener("click", () => {
    if (!state.selectedBike || !state.selectedTrack || !state.selectedCondition) {
      alert("Bitte zuerst Bike, Strecke und Bedingung auswählen.");
      return;
    }
    state.setups[currentSetupKey()] = collectSetupFromInputs();
    saveState();
    renderAll();
  });

  document.getElementById("resetSetupBtn").addEventListener("click", () => {
    if (!state.selectedBike || !state.selectedTrack || !state.selectedCondition) {
      alert("Bitte zuerst Bike, Strecke und Bedingung auswählen.");
      return;
    }
    state.setups[currentSetupKey()] = deepCopy(DEFAULT_SETUP);
    saveState();
    renderAll();
  });

  document.getElementById("separateHighLow").addEventListener("change", (e) => {
    updateBikeConfig("shockSeparate", e.target.checked);
    renderSetup();
    renderSummary();
  });

  document.getElementById("shockHighSelect").addEventListener("change", (e) => {
    updateSetupField("shockHigh", e.target.value);
    setText("shockHighValue", e.target.value);
    renderSummary();
  });

  document.getElementById("forkHeightInput").addEventListener("input", (e) => {
    updateSetupField("forkHeight", clamp(e.target.value, 0, 30));
  });

  document.getElementById("notesInput").addEventListener("input", (e) => {
    updateSetupField("notes", e.target.value);
  });

  document.getElementById("exportBtn").addEventListener("click", exportJson);
  document.getElementById("importBtn").addEventListener("click", () => {
    document.getElementById("fileInput").click();
  });
  document.getElementById("fileInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) importJson(file);
  });

  bindSlider(
    "forkPressureRange",
    "forkPressureNumber",
    "forkPressureValue",
    "forkPressureBadge",
    "forkPressureMax",
    "forkPressureMaxLabel",
    "forkPressure",
    "forkPressureMax"
  );

  bindSlider(
    "forkReboundRange",
    "forkReboundNumber",
    "forkReboundValue",
    "forkReboundBadge",
    "forkReboundMax",
    "forkReboundMaxLabel",
    "forkRebound",
    "forkReboundMax"
  );

  bindSlider(
    "shockPressureRange",
    "shockPressureNumber",
    "shockPressureValue",
    "shockPressureBadge",
    "shockPressureMax",
    "shockPressureMaxLabel",
    "shockPressure",
    "shockPressureMax"
  );

  bindSlider(
    "shockLowRange",
    "shockLowNumber",
    "shockLowValue",
    "shockLowBadge",
    "shockLowMax",
    "shockLowMaxLabel",
    "shockLow",
    "shockLowMax"
  );

  bindSlider(
    "shockReboundRange",
    "shockReboundNumber",
    "shockReboundValue",
    "shockReboundBadge",
    "shockReboundMax",
    "shockReboundMaxLabel",
    "shockRebound",
    "shockReboundMax"
  );

  bindAccordion();
  bindMaxToggles();
}

function renderAll() {
  renderBikeCards();
  renderTracks();
  renderConditions();
  renderSetup();
  renderSummary();
  saveState();
}

function runSanityChecks() {
  console.assert(clamp(30, 0, 22) === 22, "Clamp oben fehlerhaft");
  console.assert(clamp(-5, 0, 22) === 0, "Clamp unten fehlerhaft");
  console.assert(DEFAULT_BIKE_CONFIG.forkPressureMax === 22, "Default Bike Config fehlerhaft");
}

document.addEventListener("DOMContentLoaded", () => {
  runSanityChecks();
  loadState();
  bindEvents();
  renderAll();
});