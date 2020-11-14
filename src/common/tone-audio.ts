import clamp from "lodash-es/clamp";
import * as Tone from "tone";
import { Dict } from "./types";

const CENTER = "A2";

export interface PlayOptions {
	delay?: number;
	transpose?: number;
}

export interface SourceConfig {
	url?: string;
	urls?: { [key: string]: string };
	volume?: number;
}

export interface ToneAudioConfig {
	masterVolume?: number;
	sources: Dict<SourceConfig>;
}

export class ToneAudio {
	public get loaded() {
		return Object.values(this.samplers).filter((el) => !el.loaded).length === 0;
	}

	/**
	 *
	 */
	private samplers: Dict<Tone.Sampler> = {};

	/**
	 *
	 */
	private sources: Dict<SourceConfig> = {};

	/**
	 *
	 */
	init(options: ToneAudioConfig) {
		this.sources = options.sources;

		Object.entries(options.sources).forEach((entry) => {
			let key = entry[0];
			let el = entry[1];

			let sampler = new Tone.Sampler({
				urls: el.url ? { [CENTER]: el.url } : el.urls,
				volume: el.volume ?? 0,
			}).toDestination();

			this.samplers[key] = sampler;
		});
	}

	/**
	 *
	 * @param name
	 */
	play(name: string, options: PlayOptions = {}) {
		let source = this.sources[name];

		if (!source) {
			throw new Error(`Can't find sound with name "${name}"`);
		}

		let sampler = this.samplers[name];

		// TODO: check optional urls specified.
		let note = CENTER;

		let time = Tone.now();

		if (options.transpose) {
			options.transpose = clamp(options.transpose, -48, 48);
			note = Tone.Midi(note).transpose(options.transpose).toNote();
		}

		if (options.delay) {
			time += options.delay;
		}

		sampler.triggerAttackRelease(note, sampler.sampleTime, time, 1);
	}
}
