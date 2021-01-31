import { EventChannel } from "../events/event-channel";

export interface AppEvents {
	init: EventChannel;
	ready: EventChannel;
	update: EventChannel<[number]>;
	render: EventChannel<[number]>;
	prerender: EventChannel<[number]>;
	postrender: EventChannel<[number]>;
	resize: EventChannel<[number, number]>;
}
