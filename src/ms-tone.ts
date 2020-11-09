import * as Tone from "tone";

export const sounds = {
	blop: new Tone.Player("blop.m4a").toDestination(),
	click: new Tone.Player("click.m4a").toDestination(),
	clack: new Tone.Player("clack.m4a").toDestination(),
	chime: new Tone.Player("chime.m4a").toDestination(),
	drip: new Tone.Player("drip.m4a").toDestination()
};

sounds.blop.volume.value = -12;
sounds.click.volume.value = -6;

let unlock = async () => {
	document.body.removeEventListener("click", unlock);
	document.body.removeEventListener("touchend", unlock);
	await Tone.start();
};

document.body.addEventListener("click", unlock);
document.body.addEventListener("touchend", unlock);
