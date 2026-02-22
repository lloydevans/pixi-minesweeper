import { forEachRandom } from "./utils";

describe("forEachRandom", () => {
	it("should visit every element exactly once", async () => {
		const input = [1, 2, 3, 4, 5];
		const visited: number[] = [];
		await forEachRandom(input, async (el) => {
			visited.push(el);
		});
		expect(visited.sort()).toEqual([1, 2, 3, 4, 5]);
	});

	it("should not modify the original array", async () => {
		const input = [1, 2, 3];
		const original = [...input];
		await forEachRandom(input, async () => {});
		expect(input).toEqual(original);
	});

	it("should handle an empty array", async () => {
		const visited: number[] = [];
		await forEachRandom([], async (el: number) => {
			visited.push(el);
		});
		expect(visited).toEqual([]);
	});

	it("should handle a single-element array", async () => {
		const visited: number[] = [];
		await forEachRandom([42], async (el) => {
			visited.push(el);
		});
		expect(visited).toEqual([42]);
	});

	it("should call callback for each element", async () => {
		const input = ["a", "b", "c"];
		let count = 0;
		await forEachRandom(input, async () => {
			count++;
		});
		expect(count).toBe(3);
	});

	it("should handle async callbacks", async () => {
		const input = [1, 2, 3];
		const results: number[] = [];
		await forEachRandom(input, async (el) => {
			await new Promise((resolve) => setTimeout(resolve, 1));
			results.push(el * 2);
		});
		expect(results.sort((a, b) => a - b)).toEqual([2, 4, 6]);
	});

	it("should process elements sequentially", async () => {
		const input = [1, 2, 3];
		const processing: number[] = [];
		const completed: number[] = [];
		await forEachRandom(input, async (el) => {
			processing.push(el);
			await new Promise((resolve) => setTimeout(resolve, 1));
			completed.push(el);
			// At each step, processing and completed should have same length
			// because elements are processed one-at-a-time (sequential)
			expect(processing.length).toBe(completed.length);
		});
	});

	it("should work with object arrays", async () => {
		const input = [{ id: 1 }, { id: 2 }, { id: 3 }];
		const ids: number[] = [];
		await forEachRandom(input, async (el) => {
			ids.push(el.id);
		});
		expect(ids.sort()).toEqual([1, 2, 3]);
	});
});
