type ListenerFnBase = (...args: unknown[]) => unknown;

interface ListenerEntry<ListenerFn extends ListenerFnBase> {
	fn: (...arg: Parameters<ListenerFn>) => ReturnType<ListenerFn>;
	ctx?: unknown;
	once?: boolean;
}

/** */
export class EventChannel<ListenerFn extends ListenerFnBase = () => void> {
	/** Total current listeners */
	public get listenerCount(): number {
		return this.listeners.length;
	}

	/** Listeners array */
	private listeners: ListenerEntry<ListenerFn>[] = [];

	/**
	 * Add an event listener.
	 *
	 * @param fn
	 * @param ctx
	 */
	public on<ThisType>(fn: (this: ThisType, ...arg: Parameters<ListenerFn>) => ReturnType<ListenerFn>, ctx: ThisType): void;
	public on(fn: (...arg: Parameters<ListenerFn>) => ReturnType<ListenerFn>): void;
	public on(fn: (...arg: Parameters<ListenerFn>) => ReturnType<ListenerFn>, ctx?: unknown): void {
		this.listeners.push({ fn, ctx });
	}

	/**
	 * Add an event listener which fires once only.
	 *
	 * @param fn
	 * @param ctx
	 */
	public once<ThisType>(fn: (this: ThisType, ...arg: Parameters<ListenerFn>) => ReturnType<ListenerFn>, ctx: ThisType): void;
	public once(fn: (...arg: Parameters<ListenerFn>) => ReturnType<ListenerFn>): void;
	public once(fn: (...arg: Parameters<ListenerFn>) => ReturnType<ListenerFn>, ctx?: unknown): void {
		this.listeners.push({ fn, ctx, once: true });
	}

	/**
	 * Remove an event listener.
	 *
	 * @param fn
	 * @param ctx
	 */
	public off(fn?: (...arg: Parameters<ListenerFn>) => ReturnType<ListenerFn>, ctx?: unknown): void {
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
	public emit(...args: Parameters<ListenerFn>): void {
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
