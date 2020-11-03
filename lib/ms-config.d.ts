export declare type NumberKey = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";
export declare type GameDifficulty = "easy" | "medium" | "hard";
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
export declare const MS_CONFIG_DEFAULT: MSConfig;
