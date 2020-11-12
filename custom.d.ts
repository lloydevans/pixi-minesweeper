declare namespace createjs {
	class TweenGroup {
		_tweens: [];
		_paused: false;
		_timeScale: null;
		_setPaused(value: boolean): void;
		_getPaused(): void;
		_setTimeScale(value: number): void;
		_getTimeScale(): void;
		get(target: any, props?: any): Tween;
		add(tween: Tween): Tween;
		remove(tween: Tween): void;
		reset(keepGroups?: boolean): void;
		_onComplete(evt: any): void;

		constructor(paused: boolean, timeScale: number);

		get paused(): boolean;
		set paused(value);
		get timeScale(): number;
		set timeScale(value);
	}
}
