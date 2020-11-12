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

const DURATION = 31.31;
const MAX_QUEUE = 24;
const BUFFER = 0.5;

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

let playIdx = 0;

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

	playIdx++;

	let _playIdx = playIdx;

	let start = Tone.now();

	let original = midi.tracks[0].notes as MidiNote[];

	let notes = [...original];

	let loops = 0;

	while (isPlaying && _playIdx === playIdx) {
		let now = Tone.now();

		let totalQueued = 0;

		while (notes[0].time + start + DURATION * loops < now + BUFFER) {
			let loopOffset = DURATION * loops;
			let note = notes.shift()!;

			if (notes.length === 0) {
				notes = notes.concat(original);
				loops++;
			}

			if (totalQueued > MAX_QUEUE) continue;

			totalQueued++;

			try {
				synth.triggerAttackRelease(
					//
					note.name,
					note.duration,
					note.time + start + loopOffset,
					note.velocity
				);
			} catch (err) {
				console.log(err);
			}
		}

		if (!isPlaying) {
			break;
		}

		await delay(BUFFER * 1000);
	}
}

export function stopMidi() {
	isPlaying = false;
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
