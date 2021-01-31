interface Listener<T extends Array<unknown>> {
	fn: (...args: T) => void;
	ctx?: unknown;
	once?: boolean;
}

/**
 *
 */
export class EventChannel<T extends Array<unknown> = []> {
	private listeners: Listener<T>[] = [];

	public get listenerCount() {
		return this.listeners.length;
	}

	public on(fn: (...args: T) => void, ctx?: unknown) {
		this.listeners.push({ fn, ctx: ctx });
	}

	public once(fn: (...args: T) => void, ctx?: unknown) {
		this.listeners.push({ fn, ctx: ctx, once: true });
	}

	public off(fn?: (...args: T) => void, ctx?: unknown) {
		if (!fn && !ctx) {
			this.listeners = [];
		}

		if (fn && !ctx) {
			for (let i = 0; i < this.listeners.length; i++) {
				const listener = this.listeners[i];

				if (listener.fn === fn) {
					this.listeners.splice(i, 1);
					i--;
				}
			}
		}

		if (fn && ctx) {
			for (let i = 0; i < this.listeners.length; i++) {
				const listener = this.listeners[i];

				if (listener.fn === fn && listener.ctx === ctx) {
					this.listeners.splice(i, 1);
					i--;
				}
			}
		}
	}

	public emit(...args: T) {
		for (let i = 0; i < this.listeners.length; i++) {
			const listener = this.listeners[i];
			if (listener.ctx) {
				listener.fn.call(listener.ctx, ...args);
			} else {
				listener.fn(...args);
			}

			if (listener.once) {
				this.listeners.splice(i, 1);
				i--;
			}
		}
	}
}
