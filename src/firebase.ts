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

export let auth: firebase.auth.Auth;

export let performance = {};

export let analytics = {
	logEvent: (name: string, params: any) => {
		console.log(`Log event "${name}", ${JSON.stringify(params)}`);
	},
};

if (ENV_PROD) {
	(async function () {
		firebase.initializeApp(firebaseConfig);
		performance = firebase.performance();
		analytics = firebase.analytics();
		auth = firebase.auth();

		auth.onAuthStateChanged(onAuth);

		await init();
	})();
}

async function init() {
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
	}
}

function signIn(email: string, password: string) {
	return auth.signInWithEmailAndPassword(email, password);
}

function signInAnonymously() {
	return auth.signInAnonymously();
}

function createAccount(email: string, password: string) {
	return auth.createUserWithEmailAndPassword(email, password);
}
