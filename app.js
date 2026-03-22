let bikes = ["KX250F"];
let currentBike = "KX250F";
let setups = [];

function renderBikes() {
  const container = document.getElementById("bikeList");
  container.innerHTML = "";

  bikes.forEach(bike => {
    const el = document.createElement("div");
    el.className = "bike" + (bike === currentBike ? " active" : "");
    el.innerText = bike;

    el.onclick = () => {
      currentBike = bike;
      document.getElementById("activeBike").innerText = bike;
      renderBikes();
      renderSetups();
    };

    container.appendChild(el);
  });
}

function addBike() {
  const input = document.getElementById("newBike");
  const name = input.value.trim();
  if (!name) return;

  bikes.push(name);
  input.value = "";
  renderBikes();
}

function saveSetup() {
  const setup = {
    bike: currentBike,
    track: document.getElementById("track").value,
    forkComp: document.getElementById("forkComp").value,
    forkReb: document.getElementById("forkReb").value,
    shockLow: document.getElementById("shockLow").value,
    shockReb: document.getElementById("shockReb").value
  };

  setups.push(setup);
  renderSetups();
  calculate();
}

function renderSetups() {
  const container = document.getElementById("setupList");
  container.innerHTML = "";

  setups
    .filter(s => s.bike === currentBike)
    .forEach(s => {
      const el = document.createElement("div");
      el.innerText = `${s.track} | F:${s.forkComp} R:${s.forkReb}`;
      container.appendChild(el);
    });
}

function calculate() {
  const comp = Number(document.getElementById("forkComp").value);
  const low = Number(document.getElementById("shockLow").value);

  const x = 50 + (low - 11) * 3;
  const y = 50 + (comp - 11) * 3;

  const point = document.getElementById("point");
  point.style.left = x + "%";
  point.style.top = y + "%";

  document.getElementById("analysisText").innerText =
    x > 60 ? "→ eher Sand Setup" : "→ eher Hartboden";
}

renderBikes();
