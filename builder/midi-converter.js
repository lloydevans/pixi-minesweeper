var fs = require("fs").promises;

const { Midi } = require("@tonejs/midi");

(async function () {
	let buffer = await fs.readFile("./assets/audio/minesweeper.mid");

	let tm = new Midi(buffer);

	await fs.writeFile("./static/minesweeper.json", JSON.stringify(tm, undefined, 2));
})();
