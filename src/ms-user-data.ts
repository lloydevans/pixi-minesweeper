import { Dict } from "./common/types";
import { MSCellStateSerialized } from "./ms-cell-state";

export interface UserData {
	stats: UserStats;
	games: Dict<GameState>;
}

export interface UserStats {
	gamesPlayed: number;
	gamesWon: number;
	gamesLost: number;
	gamesQuit: number;
}

export interface GameState {
	gridWidth: number;
	gridHeight: number;
	startMines: number;
	cells: MSCellStateSerialized[];
}
