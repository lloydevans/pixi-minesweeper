import { Midi } from "@tonejs/midi";
import clamp from "lodash-es/clamp";
import defaults from "lodash-es/defaults";
import * as PIXI from "pixi.js-legacy";
import * as Tone from "tone";
import type { Dict } from "./types";

const CENTER_NOTE = "A3";
const MAX_QUEUE = 64;
const BUFFER_TIME = 3;

export interface NoteJSON {
	time: number;
	midi: number;
	name: string;
	velocity: number;
	duration: number;
	ticks: number;
	durationTicks: number;
}

export interface PlayOptions {
	type: "attack-release" | "attack" | "release";
	delay: number;
	transpose: number;
	duration: number;
	volume: number;
}

export const DEFAULT_PLAY_OPTIONS: PlayOptions = {
	type: "attack-release",
	delay: 0,
	transpose: 0,
	duration: 0,
	volume: 1,
};

export interface SourceConfig {
	name: string;
	url: string;
	volume?: number;
}

export interface SourceEntry extends SourceConfig {
	duration: number;
}

export interface ToneAudioConfig {
	masterVolume?: number;
	sources: Dict<SourceConfig>;
}

export interface MidiPlaybackData {
	tracks: ReadonlyArray<MidiPlaybackTrackData>;
	duration: number;
	start: number;
}

export interface MidiPlaybackTrackData {
	name: string;
	notes: NoteJSON[];
	original: NoteJSON[];
	loops: number;
}

/**
 *
 */
export class ToneAudio {
	private static buffers: Dict<Tone.ToneAudioBuffer> = {};

	/**
	 *
	 * @param config
	 */
	private static async loadBuffers(config: ToneAudioConfig) {
		const entries = Object.entries(config.sources);

		const requests = [];

		try {
			for (let i = 0; i < entries.length; i++) {
				const el = entries[i][1];

				if (!ToneAudio.buffers[el.url]) {
					const buffer = new Tone.Buffer();
					requests.push(buffer.load(el.url));
					ToneAudio.buffers[el.url] = buffer;
				}
			}

			// TODO: Concurrent request limit.
			await Promise.all(requests);
		} catch (err) {
			console.log(err);
		}
	}

	/**
	 * Middleware handles async loading required for audio config JSON.
	 *
	 * @param resource - resource reference.
	 * @param next - Continue loader.
	 */
	public static async configLoader(this: PIXI.Loader, resource: PIXI.LoaderResource, next: () => any) {
		if (!resource.data?.toneAudioConfig) {
			return next();
		}

		const config = resource.data as ToneAudioConfig;

		await ToneAudio.loadBuffers(config);

		return next();
	}

	/**
	 *
	 * @param semitones
	 */
	public static semitoneToRate(semitones: number): number {
		return Math.exp((semitones * Math.log(2)) / 12);
	}

	private samplers: Dict<Tone.Sampler> = {};
	private players: Dict<Tone.Player> = {};
	private sources: Dict<SourceEntry> = {};
	private currentMidiPlayback?: MidiPlaybackData;
	private currentMidiData?: Midi;
	private config!: ToneAudioConfig;

	/**
	 * Set current
	 */
	public async init(config: ToneAudioConfig) {
		if (this.config) {
			throw new Error("Already initialized");
		}

		this.config = config;

		await ToneAudio.loadBuffers(config);

		this.initInstruments(config);
	}

	/**
	 *
	 */
	public update() {
		if (Tone.context.state !== "running") {
			return;
		}

		if (this.currentMidiPlayback) {
			this.updateMusic(this.currentMidiPlayback);
		}
	}

	/**
	 *
	 */
	private initPlayers(options: ToneAudioConfig) {
		const sources = Object.entries(options.sources);

		for (let i = 0; i < sources.length; i++) {
			const entry = sources[i];
			const key = entry[0];
			const el = entry[1];
			const buffer = ToneAudio.buffers[el.url];
			const player = new Tone.Player(buffer).toDestination();

			const duration = player.buffer.duration;

			this.sources[key] = { ...el, ...{ duration } };

			this.players[key] = player;
		}
	}

	/**
	 *
	 */
	private initInstruments(options: ToneAudioConfig) {
		const sources = Object.entries(options.sources);

		for (let i = 0; i < sources.length; i++) {
			const entry = sources[i];
			const key = entry[0];
			const el = entry[1];

			const buffer = ToneAudio.buffers[el.url];

			const duration = buffer.duration;

			this.sources[key] = { ...el, ...{ duration } };

			const sampler = new Tone.Sampler({
				urls: { [CENTER_NOTE]: buffer },
				volume: el.volume ?? 0,
			}).toDestination();

			this.samplers[key] = sampler;
		}
	}

	/**
	 *
	 * @param name
	 */
	public play(name: string, options: Partial<PlayOptions> = {}) {
		const source = this.sources[name];

		if (!source) {
			throw new Error(`Can't find sound with name "${name}"`);
		}

		options.duration = options.duration ?? source.duration;

		const { type, delay, transpose, volume, duration } = defaults(options, DEFAULT_PLAY_OPTIONS);

		const sampler = this.samplers[name];

		let note = CENTER_NOTE;

		let time = Tone.now();

		if (transpose !== 0) {
			options.transpose = clamp(transpose, -48, 48);
			note = Tone.Midi(note).transpose(options.transpose).toNote();
		}

		if (delay > 0) {
			time += delay;
		}

		switch (type) {
			default:
			case "attack-release":
				sampler.triggerAttackRelease(note, duration, time, volume);
				break;

			case "attack":
				sampler.triggerAttack(note, time, volume);
				break;

			case "release":
				sampler.triggerRelease(note, time);
				break;
		}
	}

	/**
	 *
	 * @param config
	 */
	public async playMidi(url: string) {
		if (this.currentMidiData) {
			return;
		}

		const midi = await Midi.fromUrl(url);

		this.currentMidiData = midi;

		this.currentMidiPlayback = {
			duration: midi.duration,
			start: Tone.now() + 0.5,
			tracks: midi.tracks.map((el) => {
				return {
					name: el.name,
					original: [...el.notes],
					notes: [...el.notes],
					loops: 0,
				};
			}),
		};
	}

	/**
	 *
	 */
	private updateMusic(midi: MidiPlaybackData) {
		const { tracks, start, duration } = midi;

		const now = Tone.now();

		for (let i = 0; i < tracks.length; i++) {
			const track = tracks[i];

			let totalQueued = 0;

			const sampler = this.samplers[track.name];

			if (track.notes.length === 0) continue;

			while (track.notes[0].time + start + duration * track.loops < now + BUFFER_TIME) {
				const note = track.notes.shift()!;

				// Loop note array.
				if (track.notes.length === 0) {
					track.notes = track.notes.concat(track.original);
					track.loops++;
				}

				// Skip past notes.
				if (note.time + start + duration * track.loops < now) {
					continue;
				}

				// Skip too many notes.
				if (totalQueued > MAX_QUEUE) {
					continue;
				}

				totalQueued++;

				const loopOffset = duration * track.loops;

				try {
					sampler.triggerAttackRelease(
						//
						note.name,
						note.duration,
						note.time + start + loopOffset,
						note.velocity * 0.333 // TODO: config
					);
				} catch (err) {
					console.log(err);
				}
			}
		}
	}
}

const unlock = async () => {
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
