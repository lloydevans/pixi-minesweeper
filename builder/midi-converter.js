const fs = require("fs").promises;

const { Midi } = require("@tonejs/midi");

(async function () {
	const buffer = await fs.readFile("./assets/audio/minesweeper.mid");

	const midi = new Midi(buffer);

	await fs.writeFile("./static/minesweeper.json", JSON.stringify(midi, undefined, 2));
})();
