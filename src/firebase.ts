import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getPerformance } from "firebase/performance";

const firebaseApp = initializeApp({
	apiKey: "AIzaSyB1PSNZ1sZ7Esdwh_zKYhO7ody7Bo2YDhw",
	authDomain: "minesweeper-fe661.firebaseapp.com",
	databaseURL: "https://minesweeper-fe661.firebaseio.com",
	projectId: "minesweeper-fe661",
	storageBucket: "minesweeper-fe661.appspot.com",
	messagingSenderId: "227589891664",
	appId: "1:227589891664:web:211b5d896d4ae5f8939355",
	measurementId: "G-5SBBB77D8V",
});

export const performance = getPerformance(firebaseApp);
export const analytics = getAnalytics(firebaseApp);
