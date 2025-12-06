type EventHandler<T> = T extends undefined ? () => void : (data: T) => void;

interface ListenerEntry<T> {
	handler: EventHandler<T>;
	context?: unknown;
	once?: boolean;
}

/**
 * Individual event instance that can be subscribed to and emitted.
 */
export class EventEmitter<T = undefined> {
	private listeners: ListenerEntry<T>[] = [];

	/**
	 * Register an event listener.
	 *
	 * @param handler - The event handler function.
	 * @param context - Optional context to bind the handler to.
	 */
	public on(handler: EventHandler<T>, context?: unknown): void {
		this.listeners.push({ handler, context });
	}

	/**
	 * Register a one-time event listener.
	 *
	 * @param handler - The event handler function.
	 * @param context - Optional context to bind the handler to.
	 */
	public once(handler: EventHandler<T>, context?: unknown): void {
		this.listeners.push({ handler, context, once: true });
	}

	/**
	 * Unregister an event listener.
	 *
	 * @param handler - The event handler function to remove.
	 * @param context - Optional context that was used when registering.
	 */
	public off(handler: EventHandler<T>, context?: unknown): void {
		this.listeners = this.listeners.filter((entry) => {
			return !(entry.handler === handler && (entry.context === context || !context));
		});
	}

	/**
	 * Emit the event.
	 *
	 * @param data - The event data.
	 */
	public emit(...args: T extends undefined ? [] : [T]): void {
		// Create a copy to avoid issues if listeners are removed during emission
		const listeners = this.listeners.slice();

		for (let i = 0; i < listeners.length; i++) {
			const entry = listeners[i];

			if (entry.once) {
				this.off(entry.handler, entry.context);
			}

			if (entry.context) {
				(entry.handler as (...args: unknown[]) => void).call(entry.context, ...args);
			} else {
				(entry.handler as (...args: unknown[]) => void)(...args);
			}
		}
	}

	/**
	 * Remove all event listeners.
	 */
	public clear(): void {
		this.listeners = [];
	}

	/**
	 * Get the number of listeners.
	 *
	 * @returns The number of listeners.
	 */
	public get count(): number {
		return this.listeners.length;
	}
}
