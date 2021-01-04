import firebase from "firebase/app";
import "firebase/performance";
import "firebase/analytics";
import "firebase/firestore";
import "firebase/functions";
import "firebase/auth";

// Public project config.
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

export const db = firebase.firestore();

export const functions = firebase.functions();

export let analytics = {
	logEvent: (name: string, params: any) => {
		console.log(`Log event "${name}", ${JSON.stringify(params)}`);
	},
};

auth.onAuthStateChanged(onAuth);

db.settings({ ignoreUndefinedProperties: true });

if (window.location.hostname !== "localhost") {
	analytics = firebase.analytics();
	firebase.performance();
} else {
	db.useEmulator("localhost", 8080);
	functions.useEmulator("localhost", 5001);
	auth.useEmulator("http://localhost:9099/");
}

export async function setPersistence() {
	try {
		await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
	} catch (err) {
		console.log(err.code, err.message);
	}
}

function onAuth(user: firebase.User | null) {
	if (user) {
		console.log("Current user", auth.currentUser);
	} else {
		console.log("User logged out");
	}
}
