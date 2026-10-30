import "./style.css";

const treeImage = new Image();
treeImage.src = "src/Assets/tree.png";

const houseImage = new Image();
houseImage.src = "src/Assets/house.png";

const castleImage = new Image();
castleImage.src = "src/Assets/castle.png";

const mountainImage = new Image();
mountainImage.src = new URL("./Assets/mountain.png", import.meta.url).href;

type Tool = "pen" | "tree" | "house" | "castle" | "mountain" | `pen-${number}`;

type PenPreset = {
  label: string;
  color: string;
  width: number;
};
const penTools = new Map<Tool, PenPreset>();

type DrawingCommand = {
  draw(context: CanvasRenderingContext2D): void;
};

let drawing: DrawingCommand[] = [];

const drawingHistory: DrawingCommand[][] = [drawing];
let historyIndex = 0;

type Point = { x: number; y: number };

let activeGesture: {
  pointerId: number;
  stroke: ReturnType<typeof createStroke>;
} | null = null;

const app = document.querySelector<HTMLElement>("#app")!;
let selectedTool: Tool = "pen";

let stampSize = 50;
let penColor = "#000000";
let penWidth = 3;

const heading = document.createElement("h1");
heading.textContent = "Tiny World Map";

const message = document.createElement("p");
message.textContent = "Draw paths and place landmarks to create a world";

const toolbar = document.createElement("div");
toolbar.className = "toolbar";

const toolButtons = new Map<Tool, HTMLButtonElement>();

function updateSelection() {
  for (const [tool, button] of toolButtons) {
    const isSelected = tool === selectedTool;
    button.classList.toggle("selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  }
}

function selectTool(tool: Tool) {
  cancelStroke();
  selectedTool = tool;

  const preset = penTools.get(tool);
  if (preset) {
    penColor = preset.color;
    colorInput.value = preset.color;
    setSize(preset.width * 10);
  }

  updateSelection();
}

function createToolButton(tool: Tool, label: string) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;

  button.addEventListener("click", () => {
    selectTool(tool);
  });

  toolButtons.set(tool, button);
  return button;
}

toolbar.append(
  createToolButton("pen", "Pen"),
  createToolButton("tree", "Tree"),
  createToolButton("house", "House"),
  createToolButton("castle", "Castle"),
  createToolButton("mountain", "Mountain"),
);

// Pen Controls
const penControls = document.createElement("div");
penControls.className = "pen-controls";

const colorInput = document.createElement("input");
colorInput.type = "color";
colorInput.value = penColor;

colorInput.addEventListener("input", () => {
  penColor = colorInput.value;
  selectTool("pen");
});

const colorLabel = document.createElement("label");
colorLabel.textContent = "Pen color: ";
colorLabel.append(colorInput);

const penPresets = [
  { label: "Thin", width: 3 },
  { label: "Thick", width: 10 },
];

for (const preset of penPresets) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = preset.label;

  button.addEventListener("click", () => {
    setSize(preset.width * 10);
    selectedTool = "pen";
    updateSelection();
  });

  penControls.append(button);
}

// Custom pen tool
let nextPenId = 1;

function addPenPreset(preset: PenPreset): Tool {
  const tool: Tool = `pen-${nextPenId++}`;
  penTools.set(tool, { ...preset });
  penControls.append(createToolButton(tool, preset.label));

  return tool;
}

const mapPenPresets: PenPreset[] = [
  { label: "River", color: "#2f80c4", width: 10 },
  { label: "Trail", color: "#8b5a2b", width: 3 },
  { label: "Deep Forest Path", color: "#2f4f35", width: 5 },
  { label: "Border", color: "#000000", width: 6 },
];

for (const preset of mapPenPresets) {
  addPenPreset(preset);
}

const presetNameInput = document.createElement("input");
presetNameInput.type = "text";
presetNameInput.placeholder = "Preset name";
presetNameInput.setAttribute("aria-label", "Pen preset name");

const savePenButton = document.createElement("button");
savePenButton.type = "button";
savePenButton.textContent = "Save Pen Preset";
savePenButton.disabled = true;

presetNameInput.addEventListener("input", () => {
  savePenButton.disabled = presetNameInput.value.trim() === "";
});

savePenButton.addEventListener("click", () => {
  const label = presetNameInput.value.trim();
  if (!label) return;

  const tool = addPenPreset({
    label,
    color: penColor,
    width: penWidth,
  });

  selectTool(tool);
  presetNameInput.value = "";
  savePenButton.disabled = true;
});

penControls.append(presetNameInput, savePenButton);

// add slider for stamp size and pen size
const sizeSlider = document.createElement("input");
sizeSlider.type = "range";
sizeSlider.min = "10";
sizeSlider.max = "500";
sizeSlider.value = "50";

const sizeDisplay = document.createElement("span");

function setSize(size: number) {
  stampSize = size;
  penWidth = Math.min(20, Math.max(1, Math.round(size / 10)));
  sizeSlider.value = String(size);

  sizeDisplay.textContent = `${size} px`;
}

sizeSlider.addEventListener("input", () => {
  setSize(Number(sizeSlider.value));
  selectTool("pen");
});

const sizeLabel = document.createElement("label");
sizeLabel.textContent = "Size: ";

sizeLabel.append(sizeSlider, sizeDisplay);
penControls.append(colorLabel, sizeLabel);

setSize(50);

const canvas = document.createElement("canvas");
canvas.width = 800;
canvas.height = 500;
canvas.setAttribute("aria-label", "World map drawing canvas");
canvas.textContent = "Your browser does not support canvas.";

const context = canvas.getContext("2d")!;

// Tree stamp
function createTree(x: number, y: number) {
  return {
    kind: "stamp",
    x,
    y,
    size: stampSize,
    draw(target: CanvasRenderingContext2D) {
      target.save();
      target.drawImage(
        treeImage,
        this.x - this.size / 2,
        this.y - this.size / 2,
        this.size,
        this.size,
      );
      target.restore();
    },
  };
}

// House stamp
function createHouse(x: number, y: number) {
  return {
    kind: "stamp",
    x,
    y,
    size: stampSize,
    draw(target: CanvasRenderingContext2D) {
      target.save();
      target.drawImage(
        houseImage,
        this.x - this.size / 2,
        this.y - this.size / 2,
        this.size,
        this.size,
      );
      target.restore();
    },
  };
}

function createCastle(x: number, y: number) {
  return {
    kind: "stamp",
    x,
    y,
    size: stampSize,
    draw(target: CanvasRenderingContext2D) {
      target.save();
      target.drawImage(
        castleImage,
        this.x - this.size / 2,
        this.y - this.size / 2,
        this.size,
        this.size,
      );
      target.restore();
    },
  };
}

function createMountain(x: number, y: number) {
  return {
    kind: "stamp",
    x,
    y,
    size: stampSize,
    draw(target: CanvasRenderingContext2D) {
      target.save();
      target.drawImage(
        mountainImage,
        this.x - this.size / 2,
        this.y - this.size / 2,
        this.size,
        this.size,
      );
      target.restore();
    },
  };
}

function createStroke(start: Point) {
  return {
    kind: "stroke",
    points: [start],
    color: penColor,
    width: penWidth,
    draw(target: CanvasRenderingContext2D) {
      const first = this.points[0]!;
      target.save();
      target.strokeStyle = this.color;
      target.fillStyle = this.color;
      target.lineWidth = this.width;
      target.lineCap = "round";
      target.lineJoin = "round";
      target.beginPath();

      if (this.points.length === 1) {
        target.arc(first.x, first.y, this.width / 2, 0, Math.PI * 2);
        target.fill();
      } else {
        target.moveTo(first.x, first.y);
        for (const point of this.points.slice(1)) {
          target.lineTo(point.x, point.y);
        }
        target.stroke();
      }

      target.restore();
    },
  };
}

function extendStroke(event: PointerEvent) {
  if (!activeGesture) return;

  const bounds = canvas.getBoundingClientRect();
  const point = {
    x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
    y: (event.clientY - bounds.top) * (canvas.height / bounds.height),
  };
  const points = activeGesture.stroke.points;
  const last = points[points.length - 1]!;

  if (point.x !== last.x || point.y !== last.y) {
    points.push(point);
  }
}

function cancelStroke() {
  if (!activeGesture) return;
  activeGesture = null;
  redraw();
}

canvas.addEventListener("pointerdown", (event) => {
  if (
    (selectedTool !== "pen" && !penTools.has(selectedTool)) ||
    event.button !== 0 ||
    !event.isPrimary || activeGesture
  ) return;

  const bounds = canvas.getBoundingClientRect();
  const start = {
    x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
    y: (event.clientY - bounds.top) * (canvas.height / bounds.height),
  };
  activeGesture = {
    pointerId: event.pointerId,
    stroke: createStroke(start),
  };
  redraw();
});

canvas.addEventListener("pointermove", (event) => {
  if (activeGesture?.pointerId !== event.pointerId) return;
  if ((event.buttons & 1) === 0) {
    cancelStroke();
    return;
  }
  extendStroke(event);
  redraw();
});

canvas.addEventListener("pointerup", (event) => {
  if (!activeGesture || activeGesture.pointerId !== event.pointerId) return;
  extendStroke(event);
  const finishedStroke = activeGesture.stroke;
  activeGesture = null;
  commitDrawing([...drawing, finishedStroke]);
});

canvas.addEventListener("pointerleave", (event) => {
  if (activeGesture?.pointerId === event.pointerId) cancelStroke();
});

canvas.addEventListener("pointercancel", (event) => {
  if (activeGesture?.pointerId === event.pointerId) cancelStroke();
});

globalThis.addEventListener("blur", cancelStroke);

function redraw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (const command of drawing) {
    command.draw(context);
  }

  activeGesture?.stroke.draw(context);
}

canvas.addEventListener("click", (event) => {
  if (selectedTool !== "tree") return;

  const bounds = canvas.getBoundingClientRect();
  const x = (event.clientX - bounds.left) * (canvas.width / bounds.width);
  const y = (event.clientY - bounds.top) * (canvas.height / bounds.height);

  commitDrawing([...drawing, createTree(x, y)]);
});

canvas.addEventListener("click", (event) => {
  if (selectedTool !== "house") return;

  const bounds = canvas.getBoundingClientRect();
  const x = (event.clientX - bounds.left) * (canvas.width / bounds.width);
  const y = (event.clientY - bounds.top) * (canvas.height / bounds.height);

  commitDrawing([...drawing, createHouse(x, y)]);
});

canvas.addEventListener("click", (event) => {
  if (selectedTool !== "castle") return;

  const bounds = canvas.getBoundingClientRect();
  const x = (event.clientX - bounds.left) * (canvas.width / bounds.width);
  const y = (event.clientY - bounds.top) * (canvas.height / bounds.height);

  commitDrawing([...drawing, createCastle(x, y)]);
});

canvas.addEventListener("click", (event) => {
  if (selectedTool !== "mountain") return;
  if (!mountainImage.complete || mountainImage.naturalWidth === 0) return;

  const bounds = canvas.getBoundingClientRect();
  const x = (event.clientX - bounds.left) * (canvas.width / bounds.width);
  const y = (event.clientY - bounds.top) * (canvas.height / bounds.height);

  commitDrawing([...drawing, createMountain(x, y)]);
});

const redrawButton = document.createElement("button");
redrawButton.type = "button";
redrawButton.textContent = "Redraw";
redrawButton.addEventListener("click", redraw);
toolbar.append(redrawButton);

const historyControls = document.createElement("div");
historyControls.className = "history-controls";

const undoButton = document.createElement("button");
undoButton.type = "button";
undoButton.textContent = "Undo";

const redoButton = document.createElement("button");
redoButton.type = "button";
redoButton.textContent = "Redo";

const clearButton = document.createElement("button");
clearButton.type = "button";
clearButton.textContent = "Clear";

clearButton.addEventListener("click", () => {
  cancelStroke();
  if (drawing.length === 0) return;
  commitDrawing([]);
});

function updateHistoryButtons() {
  undoButton.disabled = historyIndex === 0;
  redoButton.disabled = historyIndex === drawingHistory.length - 1;
  clearButton.disabled = drawing.length === 0;
}

// Save a new map state and discard any abandoned redo history.
function commitDrawing(nextDrawing: DrawingCommand[]) {
  drawing = [...nextDrawing];
  drawingHistory.splice(historyIndex + 1);
  drawingHistory.push(drawing);
  historyIndex = drawingHistory.length - 1;

  updateHistoryButtons();
  redraw();
}

undoButton.addEventListener("click", () => {
  if (historyIndex === 0) return;

  activeGesture = null;
  historyIndex -= 1;
  drawing = drawingHistory[historyIndex]!;

  updateHistoryButtons();
  redraw();
});

redoButton.addEventListener("click", () => {
  if (historyIndex === drawingHistory.length - 1) return;

  activeGesture = null;
  historyIndex += 1;
  drawing = drawingHistory[historyIndex]!;

  updateHistoryButtons();
  redraw();
});

// PNG export
const exportButton = document.createElement("button");
exportButton.type = "button";
exportButton.textContent = "Download PNG";

const exportStatus = document.createElement("span");
exportStatus.setAttribute("role", "status");

exportButton.addEventListener("click", () => {
  exportStatus.textContent = "";

  try {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width * 2;
    exportCanvas.height = canvas.height * 2;

    const exportContext = exportCanvas.getContext("2d");
    if (!exportContext) {
      throw new Error("Could not create the export context.");
    }

    exportContext.fillStyle = "#fffdf5";
    exportContext.fillRect(
      0,
      0,
      exportCanvas.width,
      exportCanvas.height,
    );
    exportContext.scale(2, 2);

    for (const command of drawing) {
      command.draw(exportContext);
    }

    exportCanvas.toBlob((blob) => {
      if (!blob) {
        exportStatus.textContent = "Could not create the PNG. Try again.";
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "tiny-world-map.png";
      link.hidden = true;
      document.body.append(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      exportStatus.textContent = "PNG download requested.";
    }, "image/png");
  } catch (error) {
    exportStatus.textContent = "Could not export the map. Try again.";
    console.error("PNG export failed:", error);
  }
});

historyControls.append(
  undoButton,
  redoButton,
  clearButton,
  exportButton,
  exportStatus,
);
updateHistoryButtons();

const canvasFrame = document.createElement("div");
canvasFrame.className = "canvas-frame";
canvasFrame.append(canvas);

app.append(
  heading,
  message,
  toolbar,
  penControls,
  historyControls,
  canvasFrame,
);

const controlPanel = document.createElement("div");
controlPanel.className = "control-panel";

const tools = document.createElement("div");
tools.className = "control-section";
tools.append(toolbar);

const settings = document.createElement("div");
settings.className = "control-section";
settings.append(penControls, historyControls);

const helpButtons = document.createElement("div");
helpButtons.className = "control-section";
helpButtons.append(historyControls);

controlPanel.append(
  tools,
  canvasFrame,
  settings,
);
app.append(
  heading,
  message,
  controlPanel,
);

updateSelection();
