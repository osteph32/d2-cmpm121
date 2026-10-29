import "./style.css";

const treeImage = new Image();
treeImage.src = "src/Assets/tree.png";

const houseImage = new Image();
houseImage.src = "src/Assets/house.png";

const castleImage = new Image();
castleImage.src = "src/Assets/castle.png";

const mountainImage = new Image();
mountainImage.src = new URL("./Assets/mountain.png", import.meta.url).href;

type Tool = "pen" | "tree" | "house" | "castle" | "mountain";

type DrawingCommand = {
  draw(context: CanvasRenderingContext2D): void;
};

const drawing: DrawingCommand[] = [];

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

function createToolButton(tool: Tool, label: string) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;

  button.addEventListener("click", () => {
    selectedTool = tool;
    updateSelection();
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
});

const colorLabel = document.createElement("label");
colorLabel.textContent = "Pen color: ";
colorLabel.append(colorInput);

const penWidthSlider = document.createElement("input");
penWidthSlider.type = "range";
penWidthSlider.min = "1";
penWidthSlider.max = "20";
penWidthSlider.step = "1";

const penWidthDisplay = document.createElement("span");

function setPenWidth(width: number) {
  penWidth = width;
  penWidthSlider.value = String(width);
  penWidthDisplay.textContent = `${width} px`;
}

penWidthSlider.addEventListener("input", () => {
  setPenWidth(Number(penWidthSlider.value));
});

const widthLabel = document.createElement("label");
widthLabel.textContent = "Pen thickness: ";
widthLabel.append(penWidthSlider, penWidthDisplay);

penControls.append(colorLabel, widthLabel);

const penPresets = [
  { label: "Thin", width: 3 },
  { label: "Thick", width: 10 },
];

for (const preset of penPresets) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = preset.label;

  button.addEventListener("click", () => {
    setPenWidth(preset.width);
    selectedTool = "pen";
    updateSelection();
  });

  penControls.append(button);
}

setPenWidth(penWidth);

// add slider
const sizeSlider = document.createElement("input");
sizeSlider.type = "range";
sizeSlider.min = "10";
sizeSlider.max = "500";
sizeSlider.value = "50";

sizeSlider.addEventListener("input", () => {
  stampSize = Number(sizeSlider.value);
});
toolbar.append("Stamp Size: ", sizeSlider);

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
    selectedTool !== "pen" || event.button !== 0 ||
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
  drawing.push(activeGesture.stroke);
  activeGesture = null;
  redraw();
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

  drawing.push(createTree(x, y));
  redraw();
});

canvas.addEventListener("click", (event) => {
  if (selectedTool !== "house") return;

  const bounds = canvas.getBoundingClientRect();
  const x = (event.clientX - bounds.left) * (canvas.width / bounds.width);
  const y = (event.clientY - bounds.top) * (canvas.height / bounds.height);

  drawing.push(createHouse(x, y));
  redraw();
});

canvas.addEventListener("click", (event) => {
  if (selectedTool !== "castle") return;

  const bounds = canvas.getBoundingClientRect();
  const x = (event.clientX - bounds.left) * (canvas.width / bounds.width);
  const y = (event.clientY - bounds.top) * (canvas.height / bounds.height);

  drawing.push(createCastle(x, y));
  redraw();
});

canvas.addEventListener("click", (event) => {
  if (selectedTool !== "mountain") return;
  if (!mountainImage.complete || mountainImage.naturalWidth === 0) return;

  const bounds = canvas.getBoundingClientRect();
  const x = (event.clientX - bounds.left) * (canvas.width / bounds.width);
  const y = (event.clientY - bounds.top) * (canvas.height / bounds.height);

  drawing.push(createMountain(x, y));
  redraw();
});

const redrawButton = document.createElement("button");
redrawButton.type = "button";
redrawButton.textContent = "Redraw";
redrawButton.addEventListener("click", redraw);
toolbar.append(redrawButton);

const canvasFrame = document.createElement("div");
canvasFrame.className = "canvas-frame";
canvasFrame.append(canvas);

app.append(heading, message, toolbar, penControls, canvasFrame);
updateSelection();
