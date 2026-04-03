const STORAGE_KEY = "suspensionToolDataV2";

const BRAND_THEMES = {
  ktm: {
    name: "KTM",
    accent: "#f97316",
    soft: "rgba(249, 115, 22, 0.14)",
    border: "rgba(249, 115, 22, 0.55)",
    borderStrong: "rgba(249, 115, 22, 0.92)",
    text: "#ffedd5",
    glow: "rgba(249, 115, 22, 0.18)"
  },
  kawasaki: {
    name: "Kawasaki",
    accent: "#22c55e",
    soft: "rgba(34, 197, 94, 0.14)",
    border: "rgba(34, 197, 94, 0.55)",
    borderStrong: "rgba(34, 197, 94, 0.92)",
    text: "#dcfce7",
    glow: "rgba(34, 197, 94, 0.18)"
  },
  yamaha: {
    name: "Yamaha",
    accent: "#2563eb",
    soft: "rgba(37, 99, 235, 0.14)",
    border: "rgba(37, 99, 235, 0.55)",
    borderStrong: "rgba(37, 99, 235, 0.92)",
    text: "#dbeafe",
    glow: "rgba(37, 99, 235, 0.18)"
  },
  suzuki: {
    name: "Suzuki",
    accent: "#eab308",
    soft: "rgba(234, 179, 8, 0.14)",
    border: "rgba(234, 179, 8, 0.55)",
    borderStrong: "rgba(234, 179, 8, 0.92)",
    text: "#fef9c3",
    glow: "rgba(234, 179, 8, 0.18)"
  },
  honda: {
    name: "Honda",
    accent: "#ef4444",
    soft: "rgba(239, 68, 68, 0.14)",
    border: "rgba(239, 68, 68, 0.55)",
    borderStrong: "rgba(239, 68, 68, 0.92)",
    text: "#fee2e2",
    glow: "rgba(239, 68, 68, 0.18)"
  },
  gasgas: {
    name: "GASGAS",
    accent: "#dc2626",
    soft: "rgba(220, 38, 38, 0.14)",
    border: "rgba(220, 38, 38, 0.55)",
    borderStrong: "rgba(220, 38, 38, 0.92)",
    text: "#fee2e2",
    glow: "rgba(220, 38, 38, 0.18)"
  },
  husqvarna: {
    name: "Husqvarna",
    accent: "#60a5fa",
    soft: "rgba(96, 165, 250, 0.14)",
    border: "rgba(96, 165, 250, 0.55)",
    borderStrong: "rgba(96, 165, 250, 0.92)",
    text: "#e0f2fe",
    glow: "rgba(96, 165, 250, 0.18)"
  },
  default: {
    name: "Standard",
    accent: "#0ea5e9",
    soft: "rgba(14, 165, 233, 0.14)",
    border: "rgba(14, 165, 233, 0.55)",
    borderStrong: "rgba(56, 189, 248, 0.92)",
    text: "#dff4ff",
    glow: "rgba(14, 165, 233, 0.18)"
  }
};

const DEFAULT_SETUP = {
  forkPressure: 12,
  forkPressureMax: 22,
  forkRebound: 12,
  forkReboundMax: 22,

  separateHighLow: false,

  shockPressure: 12,
  shockPressureMax: 22,

  shockHigh: "1.5",

  shockLow: 12,
  shockLowMax: 22,

  shockRebound: 12,
  shockReboundMax: 22,

  forkHeight: 0,
  notes: ""
};

const state = createInitialState();

const el = {
  bikeList: document.getElementById("bikeList"),
  trackList: document.getElementById("trackList"),
  bikeInput: document.getElementById("bikeInput"),
  trackInput: document.getElementById("trackInput"),
  addBikeBtn: document.getElementById("addBikeBtn"),
  deleteBikeBtn: document.getElementById("deleteBikeBtn"),
  addTrackBtn: document.getElementById("addTrackBtn"),
  saveSetupBtn: document.getElementById("saveSetupBtn"),
  resetSetupBtn: document.getElementById("resetSetupBtn"),
  exportBtn: document.getElementById("exportBtn"),
  importBtn: document.getElementById("importBtn"),
  fileInput: document.getElementById("fileInput"),

  heroPill: document.getElementById("heroPill"),
  sidebarStatus: document.getElementById("sidebarStatus"),
  setupContext: document.getElementById("setupContext"),
  summaryBike: document.getElementById("summaryBike"),
  summaryTrack: document.getElementById("summaryTrack"),
  summaryCondition: document.getElementById("summaryCondition"),

  forkOverview: document.getElementById("forkOverview"),
  shockOverview: document.getElementById("shockOverview"),

  separateHighLow: document.getElementById("separateHighLow"),
  shockSimpleBlock: document.getElementById("shockSimpleBlock"),
  shockSeparateBlock: document.getElementById("shockSeparateBlock"),
  shockHighSelect: document.getElementById("shockHighSelect"),
  shockHighValue: document.getElementById("shockHighValue"),

  forkHeightInput: document.getElementById("forkHeightInput"),
  notesInput: document.getElementById("notesInput")
};

const sliderControllers = {
  forkPressure: createSliderController({
    range: "forkPressureRange",
    number: "forkPressureNumber",
    value: "forkPressureValue",
    badge: "forkPressureBadge",
    maxInput: "forkPressureMax",
    maxLabel: "forkPressureMaxLabel"
  }),
  forkRebound: createSliderController({
    range: "forkReboundRange",
    number: "forkReboundNumber",
    value: "forkReboundValue",
    badge: "forkReboundBadge",
    maxInput: "forkReboundMax",
    maxLabel: "forkReboundMaxLabel"
  }),
  shockPressure: createSliderController({
    range: "shockPressureRange",
    number: "shockPressureNumber",
    value: "shockPressureValue",
    badge: "shockPressureBadge",
    maxInput: "shockPressureMax",
    maxLabel: "shockPressureMaxLabel"
  }),
  shockLow: createSliderController({
    range: "shockLowRange",
    number: "shockLowNumber",
    value: "shockLowValue",
    badge: "shockLowBadge",
    maxInput: "shockLowMax",
    maxLabel: "shockLowMaxLabel"
  }),
  shockRebound: createSliderController({
    range: "shockReboundRange",
    number: "shockReboundNumber",
    value: "shockReboundValue",
    badge: "shockReboundBadge",
    maxInput: "shockReboundMax",
    maxLabel: "shockReboundMaxLabel"
  })
};

init();

function init() {
  bindEvents();
  loadState();
  applyBrandTheme(state.selectedBike);
  renderAll();
  loadSetupIntoForm();
  updateShockModeUI();
  updateOverviews();
  updateAccordionArrows();
}

function bindEvents() {
  el.addBikeBtn.addEventListener("click", handleAddBike);
  el.deleteBikeBtn.addEventListener("click", handleDeleteBike);
  el.addTrackBtn.addEventListener("click", handleAddTrack);
  el.saveSetupBtn.addEventListener("click", handleSaveSetup);
  el.resetSetupBtn.addEventListener("click", handleResetSetup);

  el.exportBtn.addEventListener("click", handleExport);
  el.importBtn.addEventListener("click", () => el.fileInput.click());
  el.fileInput.addEventListener("change", handleImport);

  el.bikeInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleAddBike();
    }
  });

  el.trackInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleAddTrack();
    }
  });

  document.querySelectorAll(".condition-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedCondition = button.dataset.condition;
      persistState();
      renderAll();
      loadSetupIntoForm();
    });
  });

  document.querySelectorAll(".accordion-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.target);
      if (!target) return;
      target.classList.toggle("open-content");
      updateAccordionArrows();
    });
  });

  document.querySelectorAll(".max-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const wrap = document.getElementById(button.dataset.target);
      if (!wrap) return;
      wrap.classList.toggle("hidden");
    });
  });

  el.separateHighLow.addEventListener("change", () => {
    updateShockModeUI();
    updateOverviews();
  });

  el.shockHighSelect.addEventListener("change", () => {
    el.shockHighValue.textContent = el.shockHighSelect.value;
    updateOverviews();
  });

  el.forkHeightInput.addEventListener("input", updateOverviews);
  el.notesInput.addEventListener("input", updateOverviews);

  Object.values(sliderControllers).forEach((controller) => {
    controller.onChange(updateOverviews);
  });
}

function createInitialState() {
  return {
    selectedBike: "",
    selectedTrack: "",
    selectedCondition: "",
    data: {
      bikes: {}
    }
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createSliderController(ids) {
  const range = document.getElementById(ids.range);
  const number = document.getElementById(ids.number);
  const value = document.getElementById(ids.value);
  const badge = document.getElementById(ids.badge);
  const maxInput = document.getElementById(ids.maxInput);
  const maxLabel = document.getElementById(ids.maxLabel);

  const changeCallbacks = [];

  const api = {
    set(newValue, newMax) {
      if (Number.isFinite(Number(newMax))) {
        const safeMax = clamp(Math.round(Number(newMax)), 1, 99);
        range.max = String(safeMax);
        number.max = String(safeMax);
        maxInput.value = String(safeMax);
        maxLabel.textContent = String(safeMax);
      }

      const currentMax = Number(range.max);
      const safeValue = clamp(Math.round(Number(newValue)), 0, currentMax);
      range.value = String(safeValue);
      number.value = String(safeValue);
      value.textContent = String(safeValue);
      badge.textContent = String(safeValue);
    },
    getValue() {
      return Number(range.value);
    },
    getMax() {
      return Number(range.max);
    },
    onChange(callback) {
      changeCallbacks.push(callback);
    }
  };

  function emitChange() {
    changeCallbacks.forEach((callback) => callback());
  }

  function syncValue(nextValue) {
    const currentMax = Number(range.max);
    const safeValue = clamp(Math.round(Number(nextValue)), 0, currentMax);
    range.value = String(safeValue);
    number.value = String(safeValue);
    value.textContent = String(safeValue);
    badge.textContent = String(safeValue);
    emitChange();
  }

  function syncMax(nextMax) {
    const safeMax = clamp(Math.round(Number(nextMax)), 1, 99);
    range.max = String(safeMax);
    number.max = String(safeMax);
    maxInput.value = String(safeMax);
    maxLabel.textContent = String(safeMax);

    if (Number(range.value) > safeMax) {
      syncValue(safeMax);
      return;
    }

    emitChange();
  }

  range.addEventListener("input", () => syncValue(range.value));
  number.addEventListener("input", () => syncValue(number.value));
  maxInput.addEventListener("input", () => syncMax(maxInput.value));

  api.set(range.value, maxInput.value);
  return api;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function detectBrand(bikeName = "") {
  const name = bikeName.toLowerCase().trim();

  if (
    name.includes("ktm") ||
    name.includes("sx") ||
    name.includes("exc") ||
    name.includes("smc")
  ) {
    return "ktm";
  }

  if (
    name.includes("kawasaki") ||
    name.includes("kxf") ||
    name.includes("kx-f") ||
    name.includes("kx") ||
    name.includes("klx")
  ) {
    return "kawasaki";
  }

  if (
    name.includes("yamaha") ||
    name.includes("yzf") ||
    name.includes("yz") ||
    name.includes("wr")
  ) {
    return "yamaha";
  }

  if (
    name.includes("suzuki") ||
    name.includes("rm-z") ||
    name.includes("rmz") ||
    name.includes("rm")
  ) {
    return "suzuki";
  }

  if (
    name.includes("honda") ||
    name.includes("crf") ||
    name.includes("cr ")
  ) {
    return "honda";
  }

  if (
    name.includes("gasgas") ||
    name.includes("gas gas") ||
    name.includes("mc ")
  ) {
    return "gasgas";
  }

  if (
    name.includes("husqvarna") ||
    name.includes("husky") ||
    name.includes("fc ") ||
    name.includes("tc ")
  ) {
    return "husqvarna";
  }

  return "default";
}

function getBrandTheme(bikeName = "") {
  return BRAND_THEMES[detectBrand(bikeName)] || BRAND_THEMES.default;
}

function applyBrandTheme(bikeName = "") {
  const theme = getBrandTheme(bikeName);
  const root = document.documentElement;

  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-soft", theme.soft);
  root.style.setProperty("--accent-border", theme.border);
  root.style.setProperty("--accent-border-strong", theme.borderStrong);
  root.style.setProperty("--accent-text", theme.text);
  root.style.setProperty("--accent-glow", theme.glow);
}

function handleAddBike() {
  const bikeName = el.bikeInput.value.trim();
  if (!bikeName) return;

  if (!state.data.bikes[bikeName]) {
    state.data.bikes[bikeName] = { tracks: {} };
  }

  state.selectedBike = bikeName;
  state.selectedTrack = "";
  el.bikeInput.value = "";

  applyBrandTheme(bikeName);
  persistState();
  renderAll();
  loadSetupIntoForm();
}

function handleDeleteBike() {
  if (!state.selectedBike) {
    alert("Bitte zuerst ein Bike auswählen.");
    return;
  }

  const bikeName = state.selectedBike;
  const confirmed = confirm(`Bike "${bikeName}" wirklich löschen?`);
  if (!confirmed) return;

  delete state.data.bikes[bikeName];

  const bikeNames = getBikeNames();
  state.selectedBike = bikeNames[0] || "";
  state.selectedTrack = "";
  state.selectedCondition = state.selectedCondition || "";

  applyBrandTheme(state.selectedBike);
  persistState();
  renderAll();
  loadSetupIntoForm();
}

function handleAddTrack() {
  if (!state.selectedBike) {
    alert("Bitte zuerst ein Bike auswählen.");
    return;
  }

  const trackName = el.trackInput.value.trim();
  if (!trackName) return;

  ensureBike(state.selectedBike);
  ensureTrack(state.selectedBike, trackName);

  state.selectedTrack = trackName;
  el.trackInput.value = "";

  persistState();
  renderAll();
  loadSetupIntoForm();
}

function handleSaveSetup() {
  if (!isContextReady()) {
    alert("Bitte Bike, Strecke und Bedingung wählen.");
    return;
  }

  ensureBike(state.selectedBike);
  ensureTrack(state.selectedBike, state.selectedTrack);

  state.data.bikes[state.selectedBike].tracks[state.selectedTrack].conditions[state.selectedCondition] = readForm();

  persistState();
  renderAll();
}

function handleResetSetup() {
  if (isContextReady()) {
    const saved = getCurrentSetup();
    if (saved) {
      setForm(saved);
      return;
    }
  }

  setForm(clone(DEFAULT_SETUP));
}

function handleExport() {
  const payload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    appState: state
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);

  anchor.href = url;
  anchor.download = `suspension-tool-${date}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function handleImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      const importedState = normalizeImportedState(parsed);

      state.selectedBike = importedState.selectedBike;
      state.selectedTrack = importedState.selectedTrack;
      state.selectedCondition = importedState.selectedCondition;
      state.data = importedState.data;

      normalizeSelections();
      applyBrandTheme(state.selectedBike);
      persistState();
      renderAll();
      loadSetupIntoForm();
      alert("Import erfolgreich.");
    } catch (error) {
      console.error(error);
      alert("Import fehlgeschlagen. Bitte eine gültige JSON-Datei verwenden.");
    } finally {
      el.fileInput.value = "";
    }
  };

  reader.readAsText(file);
}

function normalizeImportedState(parsed) {
  const candidate = parsed?.appState ?? parsed;
  const fresh = createInitialState();

  if (candidate && typeof candidate === "object") {
    if (typeof candidate.selectedBike === "string") {
      fresh.selectedBike = candidate.selectedBike;
    }
    if (typeof candidate.selectedTrack === "string") {
      fresh.selectedTrack = candidate.selectedTrack;
    }
    if (typeof candidate.selectedCondition === "string") {
      fresh.selectedCondition = candidate.selectedCondition;
    }

    if (candidate.data?.bikes && typeof candidate.data.bikes === "object") {
      fresh.data.bikes = clone(candidate.data.bikes);
    } else if (candidate.bikes && typeof candidate.bikes === "object") {
      fresh.data.bikes = clone(candidate.bikes);
    }
  }

  normalizeBikeData(fresh.data.bikes);
  return fresh;
}

function normalizeBikeData(bikesObject) {
  Object.keys(bikesObject).forEach((bikeName) => {
    const bike = bikesObject[bikeName];
    if (!bike || typeof bike !== "object") {
      bikesObject[bikeName] = { tracks: {} };
      return;
    }

    if (!bike.tracks || typeof bike.tracks !== "object") {
      bike.tracks = {};
    }

    Object.keys(bike.tracks).forEach((trackName) => {
      const track = bike.tracks[trackName];
      if (!track || typeof track !== "object") {
        bike.tracks[trackName] = { conditions: {} };
        return;
      }

      if (!track.conditions || typeof track.conditions !== "object") {
        track.conditions = {};
      }

      Object.keys(track.conditions).forEach((condition) => {
        track.conditions[condition] = normalizeSetup(track.conditions[condition]);
      });
    });
  });
}

function normalizeSetup(setup) {
  const clean = clone(DEFAULT_SETUP);

  if (!setup || typeof setup !== "object") {
    return clean;
  }

  clean.forkPressure = validNumber(setup.forkPressure, clean.forkPressure);
  clean.forkPressureMax = validNumber(setup.forkPressureMax, clean.forkPressureMax);

  clean.forkRebound = validNumber(setup.forkRebound, clean.forkRebound);
  clean.forkReboundMax = validNumber(setup.forkReboundMax, clean.forkReboundMax);

  clean.separateHighLow = Boolean(setup.separateHighLow);

  clean.shockPressure = validNumber(setup.shockPressure, clean.shockPressure);
  clean.shockPressureMax = validNumber(setup.shockPressureMax, clean.shockPressureMax);

  clean.shockHigh = String(setup.shockHigh ?? clean.shockHigh);

  clean.shockLow = validNumber(setup.shockLow, clean.shockLow);
  clean.shockLowMax = validNumber(setup.shockLowMax, clean.shockLowMax);

  clean.shockRebound = validNumber(setup.shockRebound, clean.shockRebound);
  clean.shockReboundMax = validNumber(setup.shockReboundMax, clean.shockReboundMax);

  clean.forkHeight = validNumber(setup.forkHeight, clean.forkHeight);
  clean.notes = typeof setup.notes === "string" ? setup.notes : clean.notes;

  return clean;
}

function validNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    const loaded = normalizeImportedState(parsed);

    state.selectedBike = loaded.selectedBike;
    state.selectedTrack = loaded.selectedTrack;
    state.selectedCondition = loaded.selectedCondition;
    state.data = loaded.data;

    normalizeSelections();
  } catch (error) {
    console.error("Fehler beim Laden:", error);
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function normalizeSelections() {
  const bikeNames = getBikeNames();

  if (!bikeNames.includes(state.selectedBike)) {
    state.selectedBike = "";
  }

  if (!state.selectedBike) {
    state.selectedTrack = "";
    return;
  }

  const trackNames = getTrackNames(state.selectedBike);
  if (!trackNames.includes(state.selectedTrack)) {
    state.selectedTrack = "";
  }

  const validConditions = ["trocken", "nass", "feucht"];
  if (!validConditions.includes(state.selectedCondition)) {
    state.selectedCondition = "";
  }
}

function ensureBike(bikeName) {
  if (!state.data.bikes[bikeName]) {
    state.data.bikes[bikeName] = { tracks: {} };
  }
}

function ensureTrack(bikeName, trackName) {
  ensureBike(bikeName);

  if (!state.data.bikes[bikeName].tracks[trackName]) {
    state.data.bikes[bikeName].tracks[trackName] = { conditions: {} };
  }
}

function getBikeNames() {
  return Object.keys(state.data.bikes);
}

function getTrackNames(bikeName) {
  if (!bikeName || !state.data.bikes[bikeName]) return [];
  return Object.keys(state.data.bikes[bikeName].tracks);
}

function isContextReady() {
  return Boolean(state.selectedBike && state.selectedTrack && state.selectedCondition);
}

function getCurrentSetup() {
  if (!isContextReady()) return null;

  return state.data.bikes[state.selectedBike]?.tracks[state.selectedTrack]?.conditions?.[state.selectedCondition] || null;
}

function readForm() {
  return normalizeSetup({
    forkPressure: sliderControllers.forkPressure.getValue(),
    forkPressureMax: sliderControllers.forkPressure.getMax(),

    forkRebound: sliderControllers.forkRebound.getValue(),
    forkReboundMax: sliderControllers.forkRebound.getMax(),

    separateHighLow: el.separateHighLow.checked,

    shockPressure: sliderControllers.shockPressure.getValue(),
    shockPressureMax: sliderControllers.shockPressure.getMax(),

    shockHigh: el.shockHighSelect.value,

    shockLow: sliderControllers.shockLow.getValue(),
    shockLowMax: sliderControllers.shockLow.getMax(),

    shockRebound: sliderControllers.shockRebound.getValue(),
    shockReboundMax: sliderControllers.shockRebound.getMax(),

    forkHeight: validNumber(el.forkHeightInput.value, 0),
    notes: el.notesInput.value.trim()
  });
}

function setForm(setup) {
  const data = normalizeSetup(setup);

  sliderControllers.forkPressure.set(data.forkPressure, data.forkPressureMax);
  sliderControllers.forkRebound.set(data.forkRebound, data.forkReboundMax);

  sliderControllers.shockPressure.set(data.shockPressure, data.shockPressureMax);
  sliderControllers.shockLow.set(data.shockLow, data.shockLowMax);
  sliderControllers.shockRebound.set(data.shockRebound, data.shockReboundMax);

  el.separateHighLow.checked = data.separateHighLow;
  el.shockHighSelect.value = data.shockHigh;
  el.shockHighValue.textContent = data.shockHigh;

  el.forkHeightInput.value = String(data.forkHeight);
  el.notesInput.value = data.notes;

  updateShockModeUI();
  updateOverviews();
}

function loadSetupIntoForm() {
  const saved = getCurrentSetup();
  if (saved) {
    setForm(saved);
  } else {
    setForm(clone(DEFAULT_SETUP));
  }
}

function updateShockModeUI() {
  const separate = el.separateHighLow.checked;
  el.shockSimpleBlock.classList.toggle("hidden", separate);
  el.shockSeparateBlock.classList.toggle("hidden", !separate);
}

function updateOverviews() {
  el.forkOverview.textContent =
    `Druckstufe ${sliderControllers.forkPressure.getValue()} · Zugstufe ${sliderControllers.forkRebound.getValue()}`;

  if (el.separateHighLow.checked) {
    el.shockOverview.textContent =
      `High ${el.shockHighSelect.value} · Low ${sliderControllers.shockLow.getValue()} · Zug ${sliderControllers.shockRebound.getValue()}`;
  } else {
    el.shockOverview.textContent =
      `Druckstufe ${sliderControllers.shockPressure.getValue()} · Zugstufe ${sliderControllers.shockRebound.getValue()}`;
  }
}

function renderAll() {
  applyBrandTheme(state.selectedBike);
  renderBikes();
  renderTracks();
  renderConditions();
  renderContextInfo();
  renderActionStates();
  updateAccordionArrows();
}

function renderBikes() {
  const bikeNames = getBikeNames();

  if (bikeNames.length === 0) {
    el.bikeList.innerHTML = `<div class="empty-state">Noch keine Bikes angelegt.</div>`;
    return;
  }

  el.bikeList.innerHTML = "";

  bikeNames.forEach((bikeName) => {
    const theme = getBrandTheme(bikeName);
    const card = document.createElement("button");

    card.type = "button";
    card.className = `bike-card${state.selectedBike === bikeName ? " active" : ""}`;
    card.style.setProperty("--card-accent", theme.accent);
    card.style.setProperty("--card-soft", theme.soft);
    card.style.setProperty("--card-border", theme.border);
    card.style.setProperty("--card-text", theme.text);

    const trackCount = getTrackNames(bikeName).length;

    card.innerHTML = `
      <div class="bike-card-top">
        <div class="bike-icon">🏍</div>
        ${state.selectedBike === bikeName ? '<div class="active-badge">Aktiv</div>' : ""}
      </div>
      <div class="bike-name">${escapeHtml(bikeName)}</div>
      <div class="bike-sub">${trackCount} Strecke${trackCount === 1 ? "" : "n"}</div>
      <div class="bike-brand">${escapeHtml(theme.name)}</div>
    `;

    card.addEventListener("click", () => {
      state.selectedBike = bikeName;

      const trackNames = getTrackNames(bikeName);
      if (!trackNames.includes(state.selectedTrack)) {
        state.selectedTrack = "";
      }

      persistState();
      renderAll();
      loadSetupIntoForm();
    });

    el.bikeList.appendChild(card);
  });
}

function renderTracks() {
  if (!state.selectedBike) {
    el.trackList.innerHTML = `<div class="empty-state">Bitte zuerst ein Bike auswählen.</div>`;
    return;
  }

  const trackNames = getTrackNames(state.selectedBike);

  if (trackNames.length === 0) {
    el.trackList.innerHTML = `<div class="empty-state">Noch keine Strecken für dieses Bike angelegt.</div>`;
    return;
  }

  el.trackList.innerHTML = "";

  trackNames.forEach((trackName) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `track-card${state.selectedTrack === trackName ? " active" : ""}`;
    button.innerHTML = `
      <div class="track-name">${escapeHtml(trackName)}</div>
      <div class="track-sub">Bike: ${escapeHtml(state.selectedBike)}</div>
    `;

    button.addEventListener("click", () => {
      state.selectedTrack = trackName;
      persistState();
      renderAll();
      loadSetupIntoForm();
    });

    el.trackList.appendChild(button);
  });
}

function renderConditions() {
  document.querySelectorAll(".condition-btn").forEach((button) => {
    const isActive = button.dataset.condition === state.selectedCondition;
    button.classList.toggle("active", isActive);
  });
}

function renderContextInfo() {
  el.summaryBike.textContent = state.selectedBike || "–";
  el.summaryTrack.textContent = state.selectedTrack || "–";
  el.summaryCondition.textContent = state.selectedCondition || "–";

  if (state.selectedBike) {
    const theme = getBrandTheme(state.selectedBike);
    el.heroPill.textContent = theme.name;
  } else {
    el.heroPill.textContent = "Kein Bike gewählt";
  }

  if (isContextReady()) {
    const label = `${state.selectedBike} · ${state.selectedTrack} · ${capitalize(state.selectedCondition)}`;
    el.setupContext.textContent = label;
    el.sidebarStatus.textContent = label;
  } else if (state.selectedBike && state.selectedTrack) {
    el.setupContext.textContent = "Bitte Bedingung wählen";
    el.sidebarStatus.textContent = `${state.selectedBike} · ${state.selectedTrack}`;
  } else if (state.selectedBike) {
    el.setupContext.textContent = "Bitte Strecke und Bedingung wählen";
    el.sidebarStatus.textContent = state.selectedBike;
  } else {
    el.setupContext.textContent = "Bitte Bike, Strecke und Bedingung wählen";
    el.sidebarStatus.textContent = "Kein Setup aktiv";
  }
}

function renderActionStates() {
  el.addTrackBtn.disabled = !state.selectedBike;
  el.deleteBikeBtn.disabled = !state.selectedBike;
  el.saveSetupBtn.disabled = !isContextReady();
}

function updateAccordionArrows() {
  document.querySelectorAll(".accordion-toggle").forEach((button) => {
    const target = document.getElementById(button.dataset.target);
    const arrow = button.querySelector(".accordion-arrow");
    if (!target || !arrow) return;

    arrow.textContent = target.classList.contains("open-content") ? "▴" : "▾";
  });
}

function capitalize(value) {
  if (!value) return "–";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}