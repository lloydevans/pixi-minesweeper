type ListenerFn = (...args: unknown[]) => unknown;

interface Listener<T extends ListenerFn = () => void> {
	fn: (...arg: Parameters<T>) => ReturnType<T>;
	ctx?: unknown;
	once?: boolean;
}

/** */
export class EventChannel<T extends ListenerFn = () => void> {
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
	public on<ThisType>(fn: (this: ThisType, ...arg: Parameters<T>) => ReturnType<T>, ctx: ThisType): void;
	public on(fn: (...arg: Parameters<T>) => ReturnType<T>): void;
	public on(fn: (...arg: Parameters<T>) => ReturnType<T>, ctx?: unknown): void {
		this.listeners.push({ fn, ctx: ctx });
	}

	/**
	 * Add an event listener which fires once only.
	 *
	 * @param fn
	 * @param ctx
	 */
	public once<ThisType>(fn: (this: ThisType, ...arg: Parameters<T>) => ReturnType<T>, ctx: ThisType): void;
	public once(fn: (...arg: Parameters<T>) => ReturnType<T>): void;
	public once(fn: (...arg: Parameters<T>) => ReturnType<T>, ctx?: unknown): void {
		this.listeners.push({ fn, ctx: ctx, once: true });
	}

	/**
	 * Remove an event listener.
	 *
	 * @param fn
	 * @param ctx
	 */
	public off(fn?: (...arg: Parameters<T>) => ReturnType<T>, ctx?: unknown): void {
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
	public emit(...args: Parameters<T>): void {
		for (let i = 0; i < this.listeners.length; i++) {
			const listener = this.listeners[i];

			if (listener.ctx) {
				listener.fn.call(listener.ctx, args);
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
