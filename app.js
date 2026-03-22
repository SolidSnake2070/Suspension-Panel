const STORAGE_KEY = "mxSuspensionToolData_v2";

const DEFAULT_DATA = {
  version: 2,
  lastUpdated: new Date().toISOString(),
  selectedBikeId: "kx250f",
  bikes: [
    {
      id: "kx85",
      name: "KX85",
      brand: "Kawasaki",
      color: "#63ff85",
      notes: "",
      activeSetupRef: {
        trackId: null,
        setupId: null
      },
      tracks: []
    },
    {
      id: "kx250f",
      name: "KX250F",
      brand: "Kawasaki",
      color: "#63ff85",
      notes: "",
      activeSetupRef: {
        trackId: "suepplingen",
        setupId: "suepplingen-dry-standard"
      },
      tracks: [
        {
          id: "suepplingen",
          name: "Süpplingen",
          surface: "Gemischt",
          conditionsNote: "Hartboden und Sand",
          notes: "Gemischter Untergrund. Je nach Wetter sehr unterschiedlich.",
          setups: [
            {
              id: "suepplingen-dry-standard",
              label: "Trocken",
              weather: "Trocken",
              terrain: "Hartboden und Sand",
              isActive: true,
              lastUsed: "2026-03-22T10:00:00.000Z",
              suspension: {
                front: {
                  compression: 12,
                  rebound: 14,
                  forkAirPressure: null
                },
                rear: {
                  lowSpeedCompression: 10,
                  highSpeedCompression: "1.5",
                  rebound: 12,
                  sag: 103
                }
              },
              tires: {
                frontPressureBar: 0.95,
                rearPressureBar: 1.0
              },
              notes: "Gutes Grundsetup für trockene Bedingungen. Vorne stabil beim Einlenken.",
              analysis: {}
            },
            {
              id: "suepplingen-wet-soft",
              label: "Nass",
              weather: "Nass",
              terrain: "Hartboden und Sand",
              isActive: false,
              lastUsed: null,
              suspension: {
                front: {
                  compression: 10,
                  rebound: 13,
                  forkAirPressure: null
                },
                rear: {
                  lowSpeedCompression: 9,
                  highSpeedCompression: "1.75",
                  rebound: 11,
                  sag: 104
                }
              },
              tires: {
                frontPressureBar: 0.9,
                rearPressureBar: 0.95
              },
              notes: "Etwas weicher für mehr Traktion auf nassem Untergrund.",
              analysis: {}
            }
          ]
        }
      ]
    },
    {
      id: "ktm-sx65",
      name: "KTM SX65",
      brand: "KTM",
      color: "#ff9a4d",
      notes: "",
      activeSetupRef: {
        trackId: null,
        setupId: null
      },
      tracks: []
    }
  ]
};

let appState = loadData();
let selectedTrackId = null;
let selectedSetupId = null;

const bikeGrid = document.getElementById("bikeGrid");
const activeSetupCard = document.getElementById("activeSetupCard");

const trackSelect = document.getElementById("trackSelect");
const setupSelect = document.getElementById("setupSelect");

const newTrackBtn = document.getElementById("newTrackBtn");
const newSetupBtn = document.getElementById("newSetupBtn");
const duplicateSetupBtn = document.getElementById("duplicateSetupBtn");
const setActiveBtn = document.getElementById("setActiveBtn");
const saveBtn = document.getElementById("saveBtn");
const deleteSetupBtn = document.getElementById("deleteSetupBtn");
const deleteTrackBtn = document.getElementById("deleteTrackBtn");

const exportBtn = document.getElementById("exportBtn");
const importInput = document.getElementById("importInput");
const resetBtn = document.getElementById("resetBtn");

const editorWrap = document.getElementById("editorWrap");

const trackName = document.getElementById("trackName");
const trackSurface = document.getElementById("trackSurface");
const trackConditionsNote = document.getElementById("trackConditionsNote");
const trackNotes = document.getElementById("trackNotes");

const setupLabel = document.getElementById("setupLabel");
const setupWeather = document.getElementById("setupWeather");
const setupTerrain = document.getElementById("setupTerrain");
const setupNotes = document.getElementById("setupNotes");

const frontCompression = document.getElementById("frontCompression");
const frontRebound = document.getElementById("frontRebound");
const forkAirPressure = document.getElementById("forkAirPressure");

const rearLowSpeed = document.getElementById("rearLowSpeed");
const rearHighSpeed = document.getElementById("rearHighSpeed");
const rearRebound = document.getElementById("rearRebound");
const rearSag = document.getElementById("rearSag");

const tireFrontPressure = document.getElementById("tireFrontPressure");
const tireRearPressure = document.getElementById("tireRearPressure");

const analysisTags = document.getElementById("analysisTags");
const analysisText = document.getElementById("analysisText");

function cloneDefaultData() {
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefaultData();
    return JSON.parse(raw);
  } catch (error) {
    console.error("Fehler beim Laden:", error);
    return cloneDefaultData();
  }
}

function saveData() {
  appState.lastUpdated = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function uid(prefix = "id") {
  if (window.crypto && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function getSelectedBike() {
  return appState.bikes.find((bike) => bike.id === appState.selectedBikeId) || null;
}

function getTrackById(bike, trackId) {
  return bike?.tracks.find((track) => track.id === trackId) || null;
}

function getSetupById(track, setupId) {
  return track?.setups.find((setup) => setup.id === setupId) || null;
}

function getActiveSetup(bike) {
  if (!bike || !bike.activeSetupRef.trackId || !bike.activeSetupRef.setupId) return null;
  const track = getTrackById(bike, bike.activeSetupRef.trackId);
  const setup = getSetupById(track, bike.activeSetupRef.setupId);
  if (!track || !setup) return null;
  return { track, setup };
}

function createEmptyTrack(name = "Neue Strecke") {
  return {
    id: uid("track"),
    name,
    surface: "Gemischt",
    conditionsNote: "",
    notes: "",
    setups: []
  };
}

function createEmptySetup(label = "Neue Variante") {
  return {
    id: uid("setup"),
    label,
    weather: "Trocken",
    terrain: "",
    isActive: false,
    lastUsed: null,
    suspension: {
      front: {
        compression: null,
        rebound: null,
        forkAirPressure: null
      },
      rear: {
        lowSpeedCompression: null,
        highSpeedCompression: "n.v.",
        rebound: null,
        sag: null
      }
    },
    tires: {
      frontPressureBar: null,
      rearPressureBar: null
    },
    notes: "",
    analysis: {}
  };
}

function formatValue(value, fallback = "—") {
  return value === null || value === undefined || value === "" ? fallback : value;
}

function renderBikes() {
  bikeGrid.innerHTML = "";

  appState.bikes.forEach((bike) => {
    const active = getActiveSetup(bike);
    const card = document.createElement("button");
    card.type = "button";
    card.className = `bike-card ${bike.id === appState.selectedBikeId ? "active" : ""}`;
    card.style.setProperty("--bike-color", bike.color || "#4da3ff");

    const activeText = active ? `${active.track.name} · ${active.setup.label}` : "Kein aktives Setup";

    card.innerHTML = `
      <div class="bike-name">${bike.name}</div>
      <div class="bike-meta">${bike.brand}</div>
      <div class="bike-meta" style="margin-top: 10px;">${activeText}</div>
    `;

    card.addEventListener("click", () => {
      appState.selectedBikeId = bike.id;
      selectedTrackId = null;
      selectedSetupId = null;
      saveData();
      renderAll();
    });

    bikeGrid.appendChild(card);
  });
}

function renderActiveSetupCard() {
  const bike = getSelectedBike();

  if (!bike) {
    activeSetupCard.className = "active-setup-card empty-state";
    activeSetupCard.textContent = "Bitte zuerst ein Bike auswählen.";
    return;
  }

  const active = getActiveSetup(bike);

  if (!active) {
    activeSetupCard.className = "active-setup-card empty-state";
    activeSetupCard.textContent = "Für dieses Bike ist noch kein aktives Setup gesetzt.";
    return;
  }

  const { track, setup } = active;
  const analysis = calculateAnalysis(setup);

  activeSetupCard.className = "active-setup-card";
  activeSetupCard.innerHTML = `
    <div class="active-title-row">
      <div>
        <div class="active-title">${bike.name} · ${setup.label}</div>
        <div class="muted">Zuletzt / aktiv für: ${track.name} · ${setup.weather}</div>
      </div>
      <div class="badge-row">
        <span class="badge">${track.surface}</span>
        <span class="badge">${setup.terrain || track.conditionsNote || "ohne Angabe"}</span>
      </div>
    </div>

    <div class="active-columns">
      <div class="compact-block">
        <h4>Gabel</h4>
        <div class="compact-list">
          <div>Druckstufe: ${formatValue(setup.suspension.front.compression)}</div>
          <div>Zugstufe: ${formatValue(setup.suspension.front.rebound)}</div>
          <div>Luftdruck: ${formatValue(setup.suspension.front.forkAirPressure)}</div>
        </div>
      </div>

      <div class="compact-block">
        <h4>Federbein</h4>
        <div class="compact-list">
          <div>Low Speed: ${formatValue(setup.suspension.rear.lowSpeedCompression)}</div>
          <div>High Speed: ${formatValue(setup.suspension.rear.highSpeedCompression)}</div>
          <div>Zugstufe: ${formatValue(setup.suspension.rear.rebound)}</div>
          <div>Sag: ${formatValue(setup.suspension.rear.sag)}</div>
        </div>
      </div>

      <div class="compact-block">
        <h4>Reifen</h4>
        <div class="compact-list">
          <div>Vorne: ${formatValue(setup.tires.frontPressureBar)}</div>
          <div>Hinten: ${formatValue(setup.tires.rearPressureBar)}</div>
        </div>
      </div>

      <div class="compact-block">
        <h4>Analyse</h4>
        <div class="badge-row">
          ${analysis.tags.map((tag) => `<span class="badge">${tag}</span>`).join("")}
        </div>
        <div class="compact-list" style="margin-top:10px;">
          <div>${analysis.text}</div>
        </div>
      </div>
    </div>

    <div style="margin-top: 14px; color: #dce8ff;">
      <strong>Notiz:</strong> ${setup.notes || "Keine Notiz vorhanden."}
    </div>
  `;
}

function renderTrackOptions() {
  const bike = getSelectedBike();
  trackSelect.innerHTML = "";

  if (!bike) {
    trackSelect.innerHTML = `<option value="">Kein Bike gewählt</option>`;
    setupSelect.innerHTML = `<option value="">Keine Variante</option>`;
    editorWrap.classList.add("hidden");
    return;
  }

  if (!bike.tracks.length) {
    trackSelect.innerHTML = `<option value="">Keine Strecke vorhanden</option>`;
    setupSelect.innerHTML = `<option value="">Keine Variante</option>`;
    selectedTrackId = null;
    selectedSetupId = null;
    editorWrap.classList.add("hidden");
    return;
  }

  if (!selectedTrackId || !getTrackById(bike, selectedTrackId)) {
    selectedTrackId =
      bike.activeSetupRef.trackId && getTrackById(bike, bike.activeSetupRef.trackId)
        ? bike.activeSetupRef.trackId
        : bike.tracks[0].id;
  }

  bike.tracks.forEach((track) => {
    const option = document.createElement("option");
    option.value = track.id;
    option.textContent = track.name;
    trackSelect.appendChild(option);
  });

  trackSelect.value = selectedTrackId;
  renderSetupOptions();
}

function renderSetupOptions() {
  const bike = getSelectedBike();
  const track = getTrackById(bike, selectedTrackId);

  setupSelect.innerHTML = "";

  if (!track) {
    setupSelect.innerHTML = `<option value="">Keine Variante</option>`;
    selectedSetupId = null;
    editorWrap.classList.add("hidden");
    return;
  }

  if (!track.setups.length) {
    setupSelect.innerHTML = `<option value="">Keine Variante vorhanden</option>`;
    selectedSetupId = null;
    editorWrap.classList.add("hidden");
    return;
  }

  if (!selectedSetupId || !getSetupById(track, selectedSetupId)) {
    const activeId = bike.activeSetupRef.setupId;
    const activeInTrack = track.setups.find((setup) => setup.id === activeId);
    selectedSetupId = activeInTrack ? activeInTrack.id : track.setups[0].id;
  }

  track.setups.forEach((setup) => {
    const option = document.createElement("option");
    option.value = setup.id;
    option.textContent = `${setup.label} · ${setup.weather}`;
    setupSelect.appendChild(option);
  });

  setupSelect.value = selectedSetupId;
  renderEditor();
}

function renderEditor() {
  const bike = getSelectedBike();
  const track = getTrackById(bike, selectedTrackId);
  const setup = getSetupById(track, selectedSetupId);

  if (!bike || !track || !setup) {
    editorWrap.classList.add("hidden");
    return;
  }

  editorWrap.classList.remove("hidden");

  trackName.value = track.name || "";
  trackSurface.value = track.surface || "Gemischt";
  trackConditionsNote.value = track.conditionsNote || "";
  trackNotes.value = track.notes || "";

  setupLabel.value = setup.label || "";
  setupWeather.value = setup.weather || "Trocken";
  setupTerrain.value = setup.terrain || "";
  setupNotes.value = setup.notes || "";

  frontCompression.value = setup.suspension.front.compression ?? "";
  frontRebound.value = setup.suspension.front.rebound ?? "";
  forkAirPressure.value = setup.suspension.front.forkAirPressure ?? "";

  rearLowSpeed.value = setup.suspension.rear.lowSpeedCompression ?? "";
  rearHighSpeed.value = setup.suspension.rear.highSpeedCompression ?? "n.v.";
  rearRebound.value = setup.suspension.rear.rebound ?? "";
  rearSag.value = setup.suspension.rear.sag ?? "";

  tireFrontPressure.value = setup.tires.frontPressureBar ?? "";
  tireRearPressure.value = setup.tires.rearPressureBar ?? "";

  renderAnalysis(calculateAnalysis(setup));
}

function renderAnalysis(analysis) {
  analysisTags.innerHTML = analysis.tags.map((tag) => `<span class="badge">${tag}</span>`).join("");
  analysisText.textContent = analysis.text;
}

function calculateAnalysis(setup) {
  const fc = Number(setup.suspension.front.compression);
  const fr = Number(setup.suspension.front.rebound);
  const rls = Number(setup.suspension.rear.lowSpeedCompression);
  const rr = Number(setup.suspension.rear.rebound);
  const sag = Number(setup.suspension.rear.sag);

  const tags = [];

  if (!Number.isNaN(fc) && !Number.isNaN(rls)) {
    const avg = (fc + rls) / 2;
    if (avg <= 9) tags.push("eher weich");
    else if (avg <= 13) tags.push("neutral");
    else tags.push("eher straff");
  }

  if (!Number.isNaN(fr) && !Number.isNaN(rr)) {
    const reboundAvg = (fr + rr) / 2;
    if (reboundAvg <= 10) tags.push("lebendig");
    else if (reboundAvg <= 14) tags.push("ruhig");
    else tags.push("sehr ruhig");
  }

  if (!Number.isNaN(sag)) {
    if (sag < 100) tags.push("heck hoch");
    else if (sag <= 106) tags.push("sag im bereich");
    else tags.push("heck tief");
  }

  if (setup.weather) tags.push(setup.weather.toLowerCase());
  if (setup.terrain) tags.push(setup.terrain);

  const parts = [];

  if (tags.includes("eher weich")) {
    parts.push("Das Setup wirkt insgesamt eher weich und dürfte auf losem oder unruhigem Untergrund mehr Komfort und Traktion bieten.");
  } else if (tags.includes("neutral")) {
    parts.push("Das Setup wirkt ausgewogen und sollte als guter Allround-Ausgangspunkt funktionieren.");
  } else if (tags.includes("eher straff")) {
    parts.push("Das Setup wirkt eher straff und passt tendenziell besser zu schnellen, härteren Bedingungen.");
  }

  if (tags.includes("lebendig")) {
    parts.push("Die Zugstufe wirkt eher offen, das Motorrad könnte schneller zurückkommen und aktiver reagieren.");
  } else if (tags.includes("ruhig")) {
    parts.push("Die Zugstufe liegt in einem ruhigen Bereich und sollte ein kontrolliertes Fahrgefühl unterstützen.");
  } else if (tags.includes("sehr ruhig")) {
    parts.push("Die Zugstufe wirkt recht langsam, was Stabilität bringen kann, aber auf engen Wellen träge wirken könnte.");
  }

  if (tags.includes("heck hoch")) {
    parts.push("Der Sag deutet auf ein eher hohes Heck hin, was Einlenken fördern kann.");
  } else if (tags.includes("heck tief")) {
    parts.push("Der Sag deutet auf ein eher tiefes Heck hin, was Stabilität bringen kann, aber das Einlenken träger machen könnte.");
  }

  return {
    tags,
    text: parts.length ? parts.join(" ") : "Keine Analyse vorhanden."
  };
}

function parseNumber(value) {
  return value === "" ? null : Number(value);
}

function collectEditorDataIntoObjects() {
  const bike = getSelectedBike();
  const track = getTrackById(bike, selectedTrackId);
  const setup = getSetupById(track, selectedSetupId);

  if (!track || !setup) return;

  track.name = trackName.value.trim() || "Neue Strecke";
  track.surface = trackSurface.value;
  track.conditionsNote = trackConditionsNote.value.trim();
  track.notes = trackNotes.value.trim();

  setup.label = setupLabel.value.trim() || "Neue Variante";
  setup.weather = setupWeather.value;
  setup.terrain = setupTerrain.value.trim();
  setup.notes = setupNotes.value.trim();

  setup.suspension.front.compression = parseNumber(frontCompression.value);
  setup.suspension.front.rebound = parseNumber(frontRebound.value);
  setup.suspension.front.forkAirPressure = parseNumber(forkAirPressure.value);

  setup.suspension.rear.lowSpeedCompression = parseNumber(rearLowSpeed.value);
  setup.suspension.rear.highSpeedCompression = rearHighSpeed.value;
  setup.suspension.rear.rebound = parseNumber(rearRebound.value);
  setup.suspension.rear.sag = parseNumber(rearSag.value);

  setup.tires.frontPressureBar = parseNumber(tireFrontPressure.value);
  setup.tires.rearPressureBar = parseNumber(tireRearPressure.value);

  setup.analysis = calculateAnalysis(setup);
}

function saveCurrentEditor() {
  collectEditorDataIntoObjects();
  saveData();
  renderAll();
}

function createNewTrack() {
  const bike = getSelectedBike();
  if (!bike) return;

  const name = window.prompt("Name der neuen Strecke:", "Neue Strecke");
  if (!name) return;

  const track = createEmptyTrack(name.trim());
  const setup = createEmptySetup("Standard");
  track.setups.push(setup);

  bike.tracks.push(track);

  selectedTrackId = track.id;
  selectedSetupId = setup.id;

  saveData();
  renderAll();
}

function createNewSetup() {
  const bike = getSelectedBike();
  const track = getTrackById(bike, selectedTrackId);
  if (!track) return;

  const label = window.prompt("Name der neuen Variante:", "Neue Variante");
  if (!label) return;

  const setup = createEmptySetup(label.trim());
  setup.terrain = track.conditionsNote || "";
  track.setups.push(setup);

  selectedSetupId = setup.id;

  saveData();
  renderAll();
}

function duplicateCurrentSetup() {
  const bike = getSelectedBike();
  const track = getTrackById(bike, selectedTrackId);
  const setup = getSetupById(track, selectedSetupId);

  if (!track || !setup) return;

  const copy = JSON.parse(JSON.stringify(setup));
  copy.id = uid("setup");
  copy.label = `${setup.label} Kopie`;
  copy.isActive = false;
  copy.lastUsed = null;

  track.setups.push(copy);
  selectedSetupId = copy.id;

  saveData();
  renderAll();
}

function setActiveSetup() {
  const bike = getSelectedBike();
  const track = getTrackById(bike, selectedTrackId);
  const setup = getSetupById(track, selectedSetupId);

  if (!bike || !track || !setup) return;

  appState.bikes.forEach((bikeItem) => {
    bikeItem.tracks.forEach((trackItem) => {
      trackItem.setups.forEach((setupItem) => {
        setupItem.isActive = false;
      });
    });
  });

  setup.isActive = true;
  setup.lastUsed = new Date().toISOString();

  bike.activeSetupRef = {
    trackId: track.id,
    setupId: setup.id
  };

  saveData();
  renderAll();
}

function deleteCurrentSetup() {
  const bike = getSelectedBike();
  const track = getTrackById(bike, selectedTrackId);
  if (!track || !selectedSetupId) return;

  if (track.setups.length <= 1) {
    window.alert("Die letzte Variante einer Strecke kann nicht gelöscht werden. Lösche stattdessen die ganze Strecke.");
    return;
  }

  const index = track.setups.findIndex((setup) => setup.id === selectedSetupId);
  if (index === -1) return;

  const toDelete = track.setups[index];

  if (!window.confirm(`Variante "${toDelete.label}" wirklich löschen?`)) return;

  track.setups.splice(index, 1);

  if (bike.activeSetupRef.setupId === toDelete.id) {
    const fallback = track.setups[0];
    fallback.isActive = true;
    bike.activeSetupRef = {
      trackId: track.id,
      setupId: fallback.id
    };
  }

  selectedSetupId = track.setups[0]?.id || null;

  saveData();
  renderAll();
}

function deleteCurrentTrack() {
  const bike = getSelectedBike();
  if (!bike || !selectedTrackId) return;

  const index = bike.tracks.findIndex((track) => track.id === selectedTrackId);
  if (index === -1) return;

  const track = bike.tracks[index];

  if (!window.confirm(`Strecke "${track.name}" wirklich löschen?`)) return;

  bike.tracks.splice(index, 1);

  if (bike.activeSetupRef.trackId === track.id) {
    bike.activeSetupRef = {
      trackId: null,
      setupId: null
    };
  }

  selectedTrackId = bike.tracks[0]?.id || null;
  selectedSetupId = selectedTrackId ? bike.tracks[0].setups[0]?.id || null : null;

  saveData();
  renderAll();
}

function exportAppData() {
  const blob = new Blob([JSON.stringify(appState, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mx-suspension-data.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importAppData(file) {
  const reader = new FileReader();

  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      appState = imported;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
      selectedTrackId = null;
      selectedSetupId = null;
      renderAll();
      window.alert("Import erfolgreich.");
    } catch (error) {
      console.error(error);
      window.alert("Import fehlgeschlagen. Bitte prüfe die JSON-Datei.");
    }
  };

  reader.readAsText(file);
}

function resetData() {
  if (!window.confirm("Wirklich alle lokalen Daten zurücksetzen?")) return;
  appState = cloneDefaultData();
  selectedTrackId = null;
  selectedSetupId = null;
  saveData();
  renderAll();
}

function renderAll() {
  renderBikes();
  renderActiveSetupCard();
  renderTrackOptions();
}

trackSelect.addEventListener("change", () => {
  selectedTrackId = trackSelect.value || null;
  selectedSetupId = null;
  renderSetupOptions();
});

setupSelect.addEventListener("change", () => {
  selectedSetupId = setupSelect.value || null;
  renderEditor();
});

newTrackBtn.addEventListener("click", createNewTrack);
newSetupBtn.addEventListener("click", createNewSetup);
duplicateSetupBtn.addEventListener("click", duplicateCurrentSetup);
setActiveBtn.addEventListener("click", setActiveSetup);
saveBtn.addEventListener("click", saveCurrentEditor);
deleteSetupBtn.addEventListener("click", deleteCurrentSetup);
deleteTrackBtn.addEventListener("click", deleteCurrentTrack);

exportBtn.addEventListener("click", exportAppData);
importInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (file) importAppData(file);
  event.target.value = "";
});
resetBtn.addEventListener("click", resetData);

renderAll();
