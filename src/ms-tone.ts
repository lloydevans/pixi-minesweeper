import * as Tone from "tone";
import { delay } from "./common/delay";

export const sounds = {
	blop: new Tone.Player("blop.m4a").toDestination(),
	click: new Tone.Player("click.m4a").toDestination(),
	clack: new Tone.Player("clack.m4a").toDestination(),
	chime: new Tone.Player("chime.m4a").toDestination(),
	drip: new Tone.Player("drip.m4a").toDestination(),
};

sounds.blop.volume.value = -12;
sounds.click.volume.value = -6;

type MidiNote = {
	name: string;
	duration: number;
	time: number;
	velocity: number;
};

const DURATION = 31.34;
const BUFFER = 1;

let synth = new Tone.PolySynth(Tone.Synth, {
	envelope: {
		attack: 0.005,
		decay: 0.3,
		sustain: 0,
		release: 0.1,
	},
	oscillator: {
		type: "sine",
	},
	volume: -24,
}).toDestination();

let isPlaying = false;

/**
 * Quick MIDI music player with much help from ToneJS.
 *
 * @param midi
 */
export async function playMidi(midi: any) {
	// Temporary
	if (isPlaying) return;

	isPlaying = true;

	let start = Tone.now() + 1;

	let original = midi.tracks[0].notes as MidiNote[];

	let notes = [...original];

	while (isPlaying) {
		let now = Tone.now();

		while (notes[0].time + start < now + BUFFER) {
			let note = notes.shift()!;

			try {
				synth.triggerAttackRelease(note.name, note.duration, note.time + start, note.velocity);
			} catch (err) {
				console.log(err);
			}

			if (notes.length === 0) {
				original.forEach((el) => {
					el.time += DURATION;
				});

				notes = [...original];
			}
		}

		await delay(BUFFER * 1000);
	}
}

let unlock = async () => {
	document.body.removeEventListener("click", unlock);
	document.body.removeEventListener("touchend", unlock);

	try {
		await Tone.start();
	} catch (err) {
		console.log(err);
	}
};
document.body.addEventListener("click", unlock);
document.body.addEventListener("touchend", unlock);
