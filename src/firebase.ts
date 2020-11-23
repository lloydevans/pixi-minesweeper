import firebase from "firebase/app";
import "firebase/performance";
import "firebase/analytics";
import "firebase/firestore";
import "firebase/auth";

const firebaseConfig = {
	apiKey: "AIzaSyB1PSNZ1sZ7Esdwh_zKYhO7ody7Bo2YDhw",
	authDomain: "minesweeper-fe661.firebaseapp.com",
	databaseURL: "https://minesweeper-fe661.firebaseio.com",
	projectId: "minesweeper-fe661",
	storageBucket: "minesweeper-fe661.appspot.com",
	messagingSenderId: "227589891664",
	appId: "1:227589891664:web:211b5d896d4ae5f8939355",
	measurementId: "G-5SBBB77D8V",
};

firebase.initializeApp(firebaseConfig);

export const auth = firebase.auth();

export let analytics = {
	logEvent: (name: string, params: any) => {
		console.log(`Log event "${name}", ${JSON.stringify(params)}`);
	},
};

if (window.location.hostname !== "localhost") {
	analytics = firebase.analytics();
	firebase.performance();
} else {
	auth.useEmulator("http://localhost:9099/");
}

auth.onAuthStateChanged(onAuth);

export async function setPersistence() {
	try {
		await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
	} catch (error) {
		var errorCode = error.code;
		var errorMessage = error.message;
		console.log(errorCode, errorMessage);
	}
}

async function onAuth(user: firebase.User | null) {
	if (user) {
		console.log("Current user", auth.currentUser);
	} else {
		console.log("User logged out");
	}
}
