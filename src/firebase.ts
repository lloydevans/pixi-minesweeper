// import "firebase/analytics";
// import { Analytics, getAnalytics } from "firebase/analytics";
// import { initializeApp } from "firebase/app";
// import { User, browserSessionPersistence, connectAuthEmulator, getAuth } from "firebase/auth";
// import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
// import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
// import { getPerformance } from "firebase/performance";

// // Public project config.
// initializeApp({
// 	apiKey: "AIzaSyB1PSNZ1sZ7Esdwh_zKYhO7ody7Bo2YDhw",
// 	authDomain: "minesweeper-fe661.firebaseapp.com",
// 	databaseURL: "https://minesweeper-fe661.firebaseio.com",
// 	projectId: "minesweeper-fe661",
// 	storageBucket: "minesweeper-fe661.appspot.com",
// 	messagingSenderId: "227589891664",
// 	appId: "1:227589891664:web:211b5d896d4ae5f8939355",
// 	measurementId: "G-5SBBB77D8V",
// });

// export const auth = getAuth();

// export const db = getFirestore();

// export const functions = getFunctions();

// export let analytics: Analytics = {
// 	logEvent: (name: string, params: any) => {
// 		console.log(`Log event "${name}", ${JSON.stringify(params)}`);
// 	},
// } as unknown as Analytics;

// auth.onAuthStateChanged(onAuth);

// // db.settings({ ignoreUndefinedProperties: true });

// if (window.location.hostname !== "localhost") {
// 	analytics = getAnalytics();
// 	const performance = getPerformance();
// } else {
// 	connectFirestoreEmulator(db, "localhost", 8080);
// 	connectFunctionsEmulator(functions, "http://localhost:9099/", 9099);
// 	connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
// }

// export async function setPersistence() {
// 	try {
// 		await auth.setPersistence(browserSessionPersistence);
// 	} catch (err) {
// 		// console.log(err.code, err.message);
// 	}
// }

// function onAuth(user: User | null) {
// 	if (user) {
// 		console.log("Current user", auth.currentUser);
// 	} else {
// 		console.log("User logged out");
// 	}
// }
