import { TypedEmitter } from "./typed-emitter";

describe("TypedEmitter", () => {
	describe("on / emit", () => {
		it("should call a registered handler when emitted", () => {
			const emitter = new TypedEmitter<number>();
			const handler = jest.fn();
			emitter.on(handler);
			emitter.emit(42);
			expect(handler).toHaveBeenCalledWith(42);
		});

		it("should call multiple handlers in order", () => {
			const emitter = new TypedEmitter<string>();
			const order: number[] = [];
			emitter.on(() => order.push(1));
			emitter.on(() => order.push(2));
			emitter.on(() => order.push(3));
			emitter.emit("test");
			expect(order).toEqual([1, 2, 3]);
		});

		it("should emit multiple times", () => {
			const emitter = new TypedEmitter<number>();
			const handler = jest.fn();
			emitter.on(handler);
			emitter.emit(1);
			emitter.emit(2);
			emitter.emit(3);
			expect(handler).toHaveBeenCalledTimes(3);
			expect(handler).toHaveBeenNthCalledWith(1, 1);
			expect(handler).toHaveBeenNthCalledWith(2, 2);
			expect(handler).toHaveBeenNthCalledWith(3, 3);
		});

		it("should support void events (no data)", () => {
			const emitter = new TypedEmitter();
			const handler = jest.fn();
			emitter.on(handler);
			emitter.emit();
			expect(handler).toHaveBeenCalledTimes(1);
		});
	});

	describe("once", () => {
		it("should only fire handler once", () => {
			const emitter = new TypedEmitter<number>();
			const handler = jest.fn();
			emitter.once(handler);
			emitter.emit(1);
			emitter.emit(2);
			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler).toHaveBeenCalledWith(1);
		});

		it("should remove the once handler after first emit", () => {
			const emitter = new TypedEmitter();
			const handler = jest.fn();
			emitter.once(handler);
			expect(emitter.count).toBe(1);
			emitter.emit();
			expect(emitter.count).toBe(0);
		});
	});

	describe("off", () => {
		it("should remove a handler", () => {
			const emitter = new TypedEmitter<number>();
			const handler = jest.fn();
			emitter.on(handler);
			emitter.off(handler);
			emitter.emit(1);
			expect(handler).not.toHaveBeenCalled();
		});

		it("should only remove the matching handler", () => {
			const emitter = new TypedEmitter<number>();
			const handler1 = jest.fn();
			const handler2 = jest.fn();
			emitter.on(handler1);
			emitter.on(handler2);
			emitter.off(handler1);
			emitter.emit(1);
			expect(handler1).not.toHaveBeenCalled();
			expect(handler2).toHaveBeenCalledWith(1);
		});

		it("should remove handler by context", () => {
			const emitter = new TypedEmitter<number>();
			const handler = jest.fn();
			const ctx = { name: "test" };
			emitter.on(handler, ctx);
			emitter.off(handler, ctx);
			emitter.emit(1);
			expect(handler).not.toHaveBeenCalled();
		});

		it("should remove handler without context even if registered with context", () => {
			const emitter = new TypedEmitter<number>();
			const handler = jest.fn();
			const ctx = { name: "test" };
			emitter.on(handler, ctx);
			// off without context should still match
			emitter.off(handler);
			emitter.emit(1);
			expect(handler).not.toHaveBeenCalled();
		});

		it("should be safe to call off with unregistered handler", () => {
			const emitter = new TypedEmitter();
			const handler = jest.fn();
			expect(() => emitter.off(handler)).not.toThrow();
		});
	});

	describe("context binding", () => {
		it("should call handler with correct context", () => {
			const emitter = new TypedEmitter<number>();
			const ctx = { value: 0 };
			emitter.on(function (this: typeof ctx, data: number) {
				this.value = data;
			}, ctx);
			emitter.emit(42);
			expect(ctx.value).toBe(42);
		});
	});

	describe("clear", () => {
		it("should remove all listeners", () => {
			const emitter = new TypedEmitter<number>();
			emitter.on(jest.fn());
			emitter.on(jest.fn());
			emitter.once(jest.fn());
			expect(emitter.count).toBe(3);
			emitter.clear();
			expect(emitter.count).toBe(0);
		});

		it("should not fire handlers after clear", () => {
			const emitter = new TypedEmitter<number>();
			const handler = jest.fn();
			emitter.on(handler);
			emitter.clear();
			emitter.emit(1);
			expect(handler).not.toHaveBeenCalled();
		});
	});

	describe("count", () => {
		it("should start at 0", () => {
			const emitter = new TypedEmitter();
			expect(emitter.count).toBe(0);
		});

		it("should increment when adding handlers", () => {
			const emitter = new TypedEmitter();
			emitter.on(jest.fn());
			expect(emitter.count).toBe(1);
			emitter.on(jest.fn());
			expect(emitter.count).toBe(2);
		});

		it("should decrement when removing handlers", () => {
			const emitter = new TypedEmitter();
			const handler = jest.fn();
			emitter.on(handler);
			expect(emitter.count).toBe(1);
			emitter.off(handler);
			expect(emitter.count).toBe(0);
		});
	});

	describe("edge cases", () => {
		it("should handle removing a listener during emit", () => {
			const emitter = new TypedEmitter();
			const handler1 = jest.fn(() => {
				emitter.off(handler2);
			});
			const handler2 = jest.fn();
			emitter.on(handler1);
			emitter.on(handler2);

			// Both should still fire because emit iterates a copy
			emitter.emit();
			expect(handler1).toHaveBeenCalledTimes(1);
			expect(handler2).toHaveBeenCalledTimes(1);

			// But handler2 should be removed for next emit
			handler1.mockClear();
			handler2.mockClear();
			emitter.emit();
			expect(handler1).toHaveBeenCalledTimes(1);
			expect(handler2).not.toHaveBeenCalled();
		});

		it("should handle adding a listener during emit", () => {
			const emitter = new TypedEmitter();
			const lateHandler = jest.fn();
			const handler = jest.fn(() => {
				emitter.on(lateHandler);
			});
			emitter.on(handler);

			// lateHandler should NOT fire during this emit (snapshot iteration)
			emitter.emit();
			expect(handler).toHaveBeenCalledTimes(1);
			expect(lateHandler).not.toHaveBeenCalled();

			// But it should fire on next emit
			emitter.emit();
			expect(lateHandler).toHaveBeenCalledTimes(1);
		});

		it("should support complex data types", () => {
			interface MyData {
				x: number;
				y: number;
				label: string;
			}
			const emitter = new TypedEmitter<MyData>();
			const handler = jest.fn();
			emitter.on(handler);
			emitter.emit({ x: 1, y: 2, label: "test" });
			expect(handler).toHaveBeenCalledWith({ x: 1, y: 2, label: "test" });
		});
	});
});
