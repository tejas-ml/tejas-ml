/**
 * Interactive Cell Explorer
 * Click organelles in animal or plant cells to learn about them.
 */

const ORGANELLES = {
  nucleus: {
    name: "Nucleus",
    color: "#a8dadc",
    summary: "The cell’s control center — holds most of the DNA and directs growth, metabolism, and reproduction.",
    function: "Stores genetic information (DNA/chromatin), runs gene expression, and coordinates cell activities.",
    found: "Animal and plant cells (eukaryotes)",
    fun: "If the cell were a city, the nucleus would be city hall — it issues the blueprints for everything else.",
    presence: "both",
    animalNote: "Usually near the center of the cell.",
    plantNote: "Often pushed to the side by the large central vacuole.",
  },
  nucleolus: {
    name: "Nucleolus",
    color: "#1d3557",
    summary: "A dense region inside the nucleus where ribosomal RNA is made and ribosome parts are assembled.",
    function: "Produces rRNA and assembles ribosomal subunits that later leave the nucleus.",
    found: "Animal and plant cells (inside the nucleus)",
    fun: "You can often spot it as a darker “dot” inside the nucleus under a microscope.",
    presence: "both",
  },
  mitochondria: {
    name: "Mitochondria",
    color: "#e76f51",
    summary: "The powerhouses of the cell — they convert energy from food into usable ATP.",
    function: "Cellular respiration: break down glucose (with oxygen) to produce ATP for the cell’s work.",
    found: "Animal and plant cells",
    fun: "Mitochondria have their own DNA and likely evolved from ancient symbiotic bacteria.",
    presence: "both",
  },
  chloroplast: {
    name: "Chloroplast",
    color: "#52b788",
    summary: "Green energy factories that capture sunlight and make sugar through photosynthesis.",
    function: "Convert light energy, CO₂, and water into glucose and oxygen.",
    found: "Plant cells (and some algae) — not typical animal cells",
    fun: "Chlorophyll makes plants green and is packed into stacked membranes called thylakoids.",
    presence: "plant",
  },
  "cell-wall": {
    name: "Cell Wall",
    color: "#d4a373",
    summary: "A rigid outer layer that protects the plant cell and gives it a fixed shape.",
    function: "Structural support, protection, and prevents over-expansion when the vacuole fills with water.",
    found: "Plant cells (cellulose); not in animal cells",
    fun: "Wood is mostly dead cell walls — cellulose stacked over years of growth.",
    presence: "plant",
  },
  membrane: {
    name: "Cell Membrane",
    color: "#e07a5f",
    summary: "A flexible lipid bilayer that encloses the cell and controls what enters and leaves.",
    function: "Selective barrier; maintains homeostasis; hosts receptors and transport proteins.",
    found: "All cells — animal and plant",
    fun: "It’s a fluid mosaic: lipids and proteins drift around like icebergs in a sea of fat.",
    presence: "both",
    animalNote: "The outer boundary of an animal cell (no wall outside it).",
    plantNote: "Lies just inside the cell wall.",
  },
  cytoplasm: {
    name: "Cytoplasm",
    color: "#f3d9c8",
    summary: "The gel-like interior of the cell where organelles sit and many reactions happen.",
    function: "Medium for metabolism, organelle support, and intracellular transport.",
    found: "Animal and plant cells",
    fun: "About 70–80% water, plus enzymes, ions, and the cytoskeleton network.",
    presence: "both",
  },
  golgi: {
    name: "Golgi Apparatus",
    color: "#e9c46a",
    summary: "The packing and shipping center — modifies proteins and lipids, then routes them in vesicles.",
    function: "Sorts, packages, and labels molecules for secretion or delivery inside the cell.",
    found: "Animal and plant cells",
    fun: "Named after Camillo Golgi, who first described it in 1898.",
    presence: "both",
  },
  rer: {
    name: "Rough Endoplasmic Reticulum",
    color: "#c9e4de",
    summary: "A folded membrane network studded with ribosomes — busy making and folding proteins.",
    function: "Synthesizes proteins destined for membranes, secretion, or organelles; starts quality control.",
    found: "Animal and plant cells",
    fun: "The “rough” look comes from ribosomes attached to its surface.",
    presence: "both",
  },
  ser: {
    name: "Smooth Endoplasmic Reticulum",
    color: "#b8e0d2",
    summary: "A ribosome-free ER network involved in lipids, detox, and calcium storage.",
    function: "Makes lipids and steroids; detoxifies chemicals; stores Ca²⁺ in some cells.",
    found: "Animal and plant cells",
    fun: "Liver cells are packed with smooth ER because they detoxify so much.",
    presence: "both",
  },
  ribosome: {
    name: "Ribosomes",
    color: "#264653",
    summary: "Tiny protein factories — read mRNA and assemble amino acids into proteins.",
    function: "Translation: convert genetic code into functional proteins.",
    found: "All cells (free in cytoplasm or on rough ER)",
    fun: "A busy cell can have millions of ribosomes working at once.",
    presence: "both",
  },
  lysosome: {
    name: "Lysosome",
    color: "#9b5de5",
    summary: "Membrane sacs full of digestive enzymes — the cell’s recycling and cleanup crew.",
    function: "Break down worn-out organelles, food particles, and invaders.",
    found: "Prominent in animal cells; plants rely more on vacuoles for similar jobs",
    fun: "If a lysosome bursts, its enzymes could digest the cell — but the acidic interior keeps them in check until needed.",
    presence: "animal",
  },
  centriole: {
    name: "Centrioles",
    color: "#457b9d",
    summary: "Cylinder-shaped structures that help organize the mitotic spindle during cell division.",
    function: "Part of the centrosome; organize microtubules for chromosome separation.",
    found: "Most animal cells; generally absent from higher plant cells",
    fun: "They look like tiny barrels made of nine microtubule triplets.",
    presence: "animal",
  },
  "vacuole-animal": {
    name: "Vacuole (small)",
    color: "#90e0ef",
    summary: "Small storage sacs that hold water, ions, or waste — much smaller than plant vacuoles.",
    function: "Temporary storage and transport of materials.",
    found: "Animal cells (multiple small ones when present)",
    fun: "Some animal cells barely have them; others use them like shipping containers.",
    presence: "animal",
  },
  "vacuole-plant": {
    name: "Central Vacuole",
    color: "#48cae4",
    summary: "A huge water-filled compartment that can fill most of the plant cell’s volume.",
    function: "Stores water, nutrients, and waste; maintains turgor pressure that keeps plants firm.",
    found: "Plant cells",
    fun: "When a plant wilts, its vacuoles have lost water and turgor pressure has dropped.",
    presence: "plant",
  },
};

/** Lists shown under each diagram (unique ids for that cell type) */
const ANIMAL_LIST = [
  "nucleus",
  "nucleolus",
  "mitochondria",
  "membrane",
  "cytoplasm",
  "golgi",
  "rer",
  "ser",
  "ribosome",
  "lysosome",
  "centriole",
  "vacuole-animal",
];

const PLANT_LIST = [
  "nucleus",
  "nucleolus",
  "mitochondria",
  "chloroplast",
  "cell-wall",
  "membrane",
  "cytoplasm",
  "vacuole-plant",
  "golgi",
  "rer",
  "ser",
  "ribosome",
];

let selectedId = null;
let selectedCell = null;

function buildLists() {
  const animalUl = document.getElementById("animal-list");
  const plantUl = document.getElementById("plant-list");

  ANIMAL_LIST.forEach((id) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = ORGANELLES[id].name;
    btn.dataset.id = id;
    btn.dataset.cell = "animal";
    btn.addEventListener("click", () => selectOrganelle(id, "animal"));
    li.appendChild(btn);
    animalUl.appendChild(li);
  });

  PLANT_LIST.forEach((id) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = ORGANELLES[id].name;
    btn.dataset.id = id;
    btn.dataset.cell = "plant";
    btn.addEventListener("click", () => selectOrganelle(id, "plant"));
    li.appendChild(btn);
    plantUl.appendChild(li);
  });
}

function selectOrganelle(id, cellType) {
  selectedId = id;
  selectedCell = cellType;
  const data = ORGANELLES[id];
  if (!data) return;

  // Highlight SVG parts with matching data-id
  document.querySelectorAll(".organelle").forEach((el) => {
    const match = el.dataset.id === id;
    el.classList.toggle("is-active", match);
    el.classList.toggle("is-dimmed", !match && selectedId !== null);
    if (match) el.setAttribute("aria-pressed", "true");
    else el.removeAttribute("aria-pressed");
  });

  // List buttons
  document.querySelectorAll(".organelle-list button").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.id === id && btn.dataset.cell === cellType);
  });

  // Panel emphasis
  document.querySelectorAll(".cell-panel").forEach((panel) => {
    panel.classList.toggle("has-selection", panel.dataset.cell === cellType);
  });

  // Detail UI
  document.getElementById("detail-empty").classList.add("hidden");
  document.getElementById("detail-content").classList.remove("hidden");

  document.getElementById("detail-swatch").style.background = data.color;
  document.getElementById("detail-cell-label").textContent =
    cellType === "animal" ? "Animal cell" : "Plant cell";
  document.getElementById("detail-title").textContent = data.name;
  document.getElementById("detail-summary").textContent = data.summary;
  document.getElementById("detail-function").textContent = data.function;
  document.getElementById("detail-found").textContent = data.found;
  document.getElementById("detail-fun").textContent = data.fun;

  const compare = document.getElementById("compare-row");
  let tagClass = "both";
  let tagText = "Both cells";
  if (data.presence === "animal") {
    tagClass = "animal-only";
    tagText = "Mainly animal";
  } else if (data.presence === "plant") {
    tagClass = "plant-only";
    tagText = "Mainly plant";
  }

  let extra = "";
  if (cellType === "animal" && data.animalNote) extra = ` ${data.animalNote}`;
  if (cellType === "plant" && data.plantNote) extra = ` ${data.plantNote}`;

  compare.innerHTML = `<span class="tag ${tagClass}">${tagText}</span> <strong>Comparison:</strong> ${presenceText(data.presence)}${extra}`;

  // Scroll detail into view on small screens
  if (window.matchMedia("(max-width: 860px)").matches) {
    document.getElementById("detail-panel").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function presenceText(presence) {
  if (presence === "both") return "Present in both animal and plant cells.";
  if (presence === "animal") return "Characteristic of animal cells; rare or different in plants.";
  return "Characteristic of plant cells; not found in typical animal cells.";
}

function resetSelection() {
  selectedId = null;
  selectedCell = null;

  document.querySelectorAll(".organelle").forEach((el) => {
    el.classList.remove("is-active", "is-dimmed");
    el.removeAttribute("aria-pressed");
  });
  document.querySelectorAll(".organelle-list button").forEach((btn) => {
    btn.classList.remove("is-active");
  });
  document.querySelectorAll(".cell-panel").forEach((panel) => {
    panel.classList.remove("has-selection");
  });

  document.getElementById("detail-empty").classList.remove("hidden");
  document.getElementById("detail-content").classList.add("hidden");
}

function initSvgClicks() {
  document.querySelectorAll(".organelle").forEach((el) => {
    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", ORGANELLES[el.dataset.id]?.name || el.dataset.id);

    const activate = (e) => {
      e.stopPropagation();
      selectOrganelle(el.dataset.id, el.dataset.cell);
    };

    el.addEventListener("click", activate);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activate(e);
      }
    });
  });
}

document.getElementById("reset-btn").addEventListener("click", resetSelection);

buildLists();
initSvgClicks();
