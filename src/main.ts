import "./style.css";

type Tool = "pen" | "tree";

const app = document.querySelector<HTMLElement>("#app")!;
let selectedTool: Tool = "pen";

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
);

const canvas = document.createElement("canvas");
canvas.width = 800;
canvas.height = 500;
canvas.setAttribute("aria-label", "World map drawing canvas");
canvas.textContent = "Your browser does not support canvas.";

const canvasFrame = document.createElement("div");
canvasFrame.className = "canvas-frame";
canvasFrame.append(canvas);

app.append(heading, message, toolbar, canvasFrame);
updateSelection();
