import { EventChannel } from "./event-channel";

describe("EventChannel", () => {
	it("should call listener", () => {
		const channel = new EventChannel();
		let callCount = 0;
		channel.on(() => callCount++);
		channel.emit();
		channel.emit();
		expect(callCount).toBe(2);
	});

	it("should call once listener", () => {
		const channel = new EventChannel();
		let callCount = 0;
		channel.once(() => callCount++);
		channel.emit();
		channel.emit();
		expect(callCount).toBe(1);
	});

	it("should call listener with args", () => {
		const channel = new EventChannel<number>();
		channel.on((num: number) => {
			expect(num).toBe(1);
		});
		channel.emit(1);
	});

	it("should call listener with supplid context", () => {
		const channel = new EventChannel();
		const ctx = { val: 0 };
		channel.on(function (this: { val: 0 }) {
			expect(this.val).toBe(0);
		}, ctx);
		channel.emit();
	});

	it("should call multiple listeners", () => {
		const channel = new EventChannel();
		let callCount = 0;
		channel.on(() => callCount++);
		channel.on(() => callCount++);
		channel.emit();
		expect(callCount).toBe(2);
	});

	it("should remove all listeners", () => {
		const channel = new EventChannel();
		let callCount = 0;
		channel.on(() => callCount++);
		channel.on(() => callCount++);
		channel.off();
		channel.emit();
		expect(callCount).toBe(0);
	});

	it("should remove all listeners with equal callback function", () => {
		const channel = new EventChannel();
		let callCount = 0;
		const cb1 = (): number => callCount++;
		const cb2 = (): number => callCount++;
		const cb3 = (): number => callCount++;
		channel.on(cb1);
		channel.on(cb2);
		channel.on(cb3);
		channel.off(cb2);
		channel.emit();
		expect(callCount).toBe(2);
	});

	it("should remove all listeners with equal callback function & context", () => {
		const channel = new EventChannel();
		const ctx1 = {};
		const ctx2 = {};
		const ctx3 = {};
		const cb1 = function (): void {};
		const cb2 = function (): void {};
		const cb3 = function (): void {};
		channel.on(cb1, ctx1);
		channel.on(cb1, ctx1);
		channel.on(cb2, ctx2);
		channel.on(cb2, ctx2);
		channel.on(cb3, ctx3);
		channel.on(cb3, ctx3);
		channel.off(cb2, ctx2);
		expect(channel.listenerCount).toBe(4);
	});
});
