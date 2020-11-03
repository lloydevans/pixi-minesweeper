export type NumberKey = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";

export type GameDifficulty = "easy" | "medium" | "hard";

/**
 *
 */
export interface MSGameConfig {
	startMines: number;
	gridWidth: number;
	gridHeight: number;
	cheatMode?: boolean;
}

/**
 *
 */
export interface MSConfig {
	colorCellUncovered: string;
	colorCellCovered: string;
	colorBackground: string;
	colorBoard: string;
	colorUiBar: string;
	colorNumberFont: string;
	colorNumberWeight: "regular" | "bold";
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
	levels: {
		easy: MSGameConfig;
		medium: MSGameConfig;
		hard: MSGameConfig;
	};
}

/**
 *
 */
export const MS_CONFIG_DEFAULT: MSConfig = {
	colorCellUncovered: "#bfb46b",
	colorCellCovered: "#b8e66e",
	colorBackground: "#303030",
	colorBoard: "#bda355",
	colorUiBar: "#7b6536",
	colorNumberFont: "Arial",
	colorNumberWeight: "bold",
	colorNumbers: {
		"1": "#326cff",
		"2": "#007a00",
		"3": "#962727",
		"4": "#FAC7D2",
		"5": "#FB7B04",
		"6": "#762407",
		"7": "#AD0E71",
		"8": "#4A6C98"
	},
	levels: {
		easy: {
			startMines: 4,
			gridWidth: 6,
			gridHeight: 6
		},
		medium: {
			startMines: 10,
			gridWidth: 10,
			gridHeight: 10
		},
		hard: {
			startMines: 30,
			gridWidth: 16,
			gridHeight: 16
		}
	}
};
