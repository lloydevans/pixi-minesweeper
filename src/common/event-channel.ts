import { AppEventName } from "./core/events/app-event-name";

export class EventChannel<T extends Function> {
	private emitter: PIXI.utils.EventEmitter;
	private name: AppEventName;
	constructor(emitter: PIXI.utils.EventEmitter, name: AppEventName) {
		this.emitter = emitter;
		this.name = name;
	}

	on(fn: T, context?: any) {
		return this.emitter.on(this.name, fn, context);
	}

	once(fn: T, context?: any) {
		return this.emitter.once(this.name, fn, context);
	}

	off(fn?: T, context?: any) {
		return this.emitter.off(this.name, fn, context);
	}
}
