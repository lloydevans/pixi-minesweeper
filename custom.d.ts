declare const ENV_VERSION: string;
declare const ENV_PROD: boolean;

declare namespace createjs {
	class TweenGroup {
		_tweens: [];
		_paused: false;
		_timeScale: null;
		_setPaused(value: boolean): void;
		_getPaused(): void;
		_setTimeScale(value: number): void;
		_getTimeScale(): void;
		get<T>(target: T, props?: any): Tween<T>;
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
