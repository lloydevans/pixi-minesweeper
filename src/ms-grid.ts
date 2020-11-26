import { Component } from "./common/component";
import { MSApp } from "./ms-app";
import { MSCell } from "./ms-cell";
import { MSCellState } from "./ms-cell-state";

export class MSGrid extends Component<MSApp> {
	children: MSCell[] = [];

	/**
	 * Enable and disable interactions on the game grid.
	 *
	 * @param enabled - Enabled state
	 */
	public setInteractionEnabled(enabled = true) {
		this.interactiveChildren = enabled;
	}

	/**
	 * Animate cell updates outwards from a target position.
	 *
	 * @param cell - Cell to animate outwards from.
	 * @param cb - Runs once for each cell. One cell per round updated must return true to continue the animation.
	 */
	public async animateUpdateFrom(cell: MSCellState, delay = 66, cb = this.cellUpdateCb): Promise<void> {
		this.interactiveChildren = false;

		const maxSide = Math.max(this.app.state.width, this.app.state.height);

		for (let i = 0; i < maxSide; i++) {
			const t = i * 2 + 1;

			let _break = true;

			for (let c = 0; c < t; c++) {
				const x = cell.x - i + c;
				const y = cell.y - i;

				if (this.app.state.coordsInBounds(x, y)) {
					cb(this.app.getCellView(x, y)) && _break && (_break = false);
				}
			}
			for (let c = 0; c < t; c++) {
				const x = cell.x + i;
				const y = cell.y - i + c;

				if (this.app.state.coordsInBounds(x, y)) {
					cb(this.app.getCellView(x, y)) && _break && (_break = false);
				}
			}
			for (let c = 0; c < t; c++) {
				const x = cell.x + i - c;
				const y = cell.y + i;

				if (this.app.state.coordsInBounds(x, y)) {
					cb(this.app.getCellView(x, y)) && _break && (_break = false);
				}
			}
			for (let c = 0; c < t; c++) {
				const x = cell.x - i;
				const y = cell.y - i + c;

				if (this.app.state.coordsInBounds(x, y)) {
					cb(this.app.getCellView(x, y)) && _break && (_break = false);
				}
			}

			if (_break) {
				break;
			}

			this.audio.play("blop", { transpose: 12, volume: 0.5 });
			this.audio.play("blop", { transpose: 24, delay: 0.05, volume: 0.25 });
			this.audio.play("blop", { transpose: 36, delay: 0.1, volume: 0.125 });

			await this.delay(delay);
		}

		this.interactiveChildren = true;
	}

	/**
	 * Default callback for `this.animatedUpdateFrom`.
	 *
	 * @param cell - Current MSCell instance.
	 */
	private cellUpdateCb(cell: MSCell): boolean {
		const needsUpdate = cell.needsUpdate();
		if (needsUpdate) {
			cell.updateViewState();
		}
		return needsUpdate;
	}

	/**
	 *
	 */
	public async noiseWipe() {
		const indexes: number[] = [];
		for (let i = 0; i < this.app.state.totalCells; i++) {
			indexes.push(i);
		}

		while (indexes.length > 0) {
			const idx = (Math.random() * indexes.length) | 0;
			const cellIdx = indexes.splice(idx, 1)[0];
			const [x, y] = this.app.state.coordsOf(cellIdx);
			const cellState = this.app.state.cellAt(x, y)!;
			const msCell = this.app.getCellView(x, y);
			msCell.setState(cellState);

			if (indexes.length % Math.floor(this.app.state.totalCells / 6) === 0) {
				const t = x / this.app.state.width + y / this.app.state.height;
				this.audio.play("blop", { transpose: t, volume: 0.5 });
				this.audio.play("blop", { transpose: t + 12, delay: 0.01, volume: 0.5 });
				await this.delay(33);
			}
		}
	}

	/**
	 *
	 */
	public updateCellStateReferences() {
		this.children.forEach((el, i) => {
			el.setState(this.app.state.cellAt(el.ix, el.iy)!);
		});
	}

	/**
	 *
	 */
	public async swipeWipe(direction: "up" | "down") {
		const indexes: number[] = [];
		for (let i = 0; i < this.app.state.totalCells; i++) {
			indexes.push(i);
		}

		while (indexes.length > 0) {
			const cellIdx = direction === "down" ? indexes.shift()! : indexes.pop()!;
			const [x, y] = this.app.state.coordsOf(cellIdx);
			const cellState = this.app.state.cellAt(x, y)!;
			const msCell = this.app.getCellView(x, y);
			msCell.setState(cellState);

			if (indexes.length % (this.app.state.width * Math.round(this.app.state.height / 10)) === 0) {
				this.audio.play("blop", { transpose: x / this.app.state.width + y / this.app.state.height });
				await this.delay(33);
			}
		}
	}
}
