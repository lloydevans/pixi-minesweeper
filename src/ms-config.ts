export type NumberKey = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";

export type GameDifficulty = "easy" | "medium" | "hard";

export interface MSGameConfig {
	startMines: number;
	gridWidth: number;
	gridHeight: number;
	cheatMode?: boolean;
}

export interface MSConfig {
	colorBackground: string;
	colorBoard: string;
	numberFont: string;
	numberWeight: "regular" | "bold";
	colorNumbers: {
		"1": string;
		"2": string;
		"3": string;
		"4": string;
		"5": string;
		"6": string;
		"7": string;
		"8": string;
	};
}

export const MS_CONFIG_DEFAULT: MSConfig = {
	colorBackground: "#303030",
	colorBoard: "#bda355",
	numberFont: "Arial",
	numberWeight: "bold",
	colorNumbers: {
		"1": "#4b6f9c",
		"2": "#5c9c49",
		"3": "#995848",
		"4": "#544896",
		"5": "#964872",
		"6": "#469183",
		"7": "#818a6a",
		"8": "#51524f",
	},
};
