import { initializeApp, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";

const PRIVACY_CONSENT_KEY = "privacy-consent-accepted";

let firebaseApp: FirebaseApp | undefined;
let analyticsInstance: Analytics | undefined;

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

// Initialize Firebase only if user has given consent
function initializeFirebase() {
	if (!firebaseApp) {
		firebaseApp = initializeApp(firebaseConfig);
		analyticsInstance = getAnalytics(firebaseApp);
		console.log("Firebase Analytics initialized with user consent");
	}
}

// Check for existing consent and initialize if present
if (localStorage.getItem(PRIVACY_CONSENT_KEY) === "true") {
	initializeFirebase();
}

// Listen for consent events from the privacy banner
window.addEventListener("privacy-consent-accepted", () => {
	initializeFirebase();
});

// Export getters that return the instances (or undefined if not initialized)
export const analytics = analyticsInstance;

// Export function to manually initialize (called when user accepts)
export { initializeFirebase };
