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

const DURATION = 188.952;
const MAX_QUEUE = 64;
const OVERLAP = 1;
const BUFFER = 3;

let synth = new Tone.PolySynth(Tone.Synth, {
	envelope: {
		attack: 0.005,
		decay: 0.2,
		sustain: 0,
		release: 0.5,
	},
	oscillator: {
		type: "sine",
	},
	volume: -24,
}).toDestination();

let sampler = new Tone.Sampler({
	urls: { A2: "rimba.m4a" },
	volume: -24,
}).toDestination();

let playIdx = 0;

let isPlaying = false;

/**
 * Quick MIDI music player with much help from ToneJS.
 *
 * This is very prototypey and randomly all in this async function for fun
 * but eventually I'll build this into a class which handles some cool midi based
 * music / sfx.
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
			let note = notes.shift()!;

			// Loop note array.
			if (notes.length === 0) {
				notes = notes.concat(original);
				loops++;
			}

			// Skip past notes.
			if (notes[0].time + start + DURATION * loops < now) {
				continue;
			}

			// Skip too many notes.
			if (totalQueued > MAX_QUEUE) {
				continue;
			}

			totalQueued++;

			let loopOffset = DURATION * loops;

			try {
				sampler.triggerAttackRelease(
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

		await delay(BUFFER * 1000 - OVERLAP * 1000);
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
