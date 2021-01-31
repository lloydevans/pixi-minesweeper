import { EventChannel } from "../events/event-channel";

export interface EntityEvents {
	init: EventChannel;
	ready: EventChannel;
	cleanup: EventChannel;
	update: EventChannel<[number]>;
	render: EventChannel<[number]>;
	prerender: EventChannel<[number]>;
	postrender: EventChannel<[number]>;
}
