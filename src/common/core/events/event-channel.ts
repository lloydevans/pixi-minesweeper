interface Listener<T extends unknown> {
	fn: (arg: T) => void;
	ctx?: unknown;
	once?: boolean;
}

/** */
export class EventChannel<T extends unknown = void> {
	/** */
	private listeners: Listener<T>[] = [];

	/** */
	public get listenerCount(): number {
		return this.listeners.length;
	}

	/**
	 * Add an event listener.
	 *
	 * @param fn
	 * @param ctx
	 */
	public on<ThisType>(fn: (this: ThisType, arg: T) => void, ctx: ThisType): void;
	public on(fn: (arg: T) => void): void;
	public on(fn: (arg: T) => void, ctx?: unknown): void {
		this.listeners.push({ fn, ctx: ctx });
	}

	/**
	 * Add an event listener which fires once only.
	 *
	 * @param fn
	 * @param ctx
	 */
	public once<ThisType>(fn: (this: ThisType, arg: T) => void, ctx: ThisType): void;
	public once(fn: (arg: T) => void): void;
	public once(fn: (arg: T) => void, ctx?: unknown): void {
		this.listeners.push({ fn, ctx: ctx, once: true });
	}

	/**
	 * Remove an event listener.
	 *
	 * @param fn
	 * @param ctx
	 */
	public off(fn?: (arg: T) => void, ctx?: unknown): void {
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

	/**
	 * Emit the event.
	 *
	 * @param args
	 */
	public emit(arg: T): void {
		for (let i = 0; i < this.listeners.length; i++) {
			const listener = this.listeners[i];

			if (listener.ctx) {
				listener.fn.call(listener.ctx, arg);
			} else {
				listener.fn(arg);
			}

			if (listener.once) {
				this.listeners.splice(i, 1);
				i--;
			}
		}
	}
}
