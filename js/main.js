import { Game } from "./game.js";
import { createUI } from "./ui.js";

const canvas = document.querySelector("#view");

try {
  const game = new Game(canvas);
  const ui = createUI(game);
  game.attachUI(ui);
  game.start();
  window.game = game;
} catch (error) {
  const note = document.createElement("pre");
  note.id = "boot-error";
  note.textContent = error?.stack || String(error);
  document.body.append(note);
  console.error(error);
}
