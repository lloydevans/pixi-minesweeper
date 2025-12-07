import { h, Component } from "preact";
import "./privacy.css";

const PRIVACY_CONSENT_KEY = "privacy-consent-accepted";

interface PrivacyState {
	showBanner: boolean;
	showModal: boolean;
}

export class PrivacyComponent extends Component<Record<string, never>, PrivacyState> {
	constructor() {
		super();
		this.state = {
			showBanner: !localStorage.getItem(PRIVACY_CONSENT_KEY),
			showModal: false,
		};
	}

	handleAccept = () => {
		localStorage.setItem(PRIVACY_CONSENT_KEY, 'true');
		this.setState({ showBanner: false });
		// Dispatch custom event to initialize Firebase Analytics
		window.dispatchEvent(new CustomEvent('privacy-consent-accepted'));
	};

	showModal = (e: h.JSX.TargetedEvent<HTMLAnchorElement, MouseEvent>) => {
		e.preventDefault();
		this.setState({ showModal: true });
	};

	closeModal = () => {
		this.setState({ showModal: false });
	};

	handleModalBackgroundClick = (e: h.JSX.TargetedEvent<HTMLDivElement, MouseEvent>) => {
		if (e.target === e.currentTarget) {
			this.closeModal();
		}
	};

	render() {
		const { showBanner, showModal } = this.state;

		return (
			<div>
				{/* Privacy Notice Banner */}
				{showBanner && (
					<div class="privacy-notice show">
						<div class="privacy-notice-content">
							<div class="privacy-notice-text">
								This site uses Firebase Analytics to improve user experience. We collect anonymous usage data.{" "}
								<a href="#" onClick={this.showModal}>
									Learn more
								</a>
							</div>
							<div class="privacy-notice-buttons">
								<button class="accept-btn" onClick={this.handleAccept}>
									Accept
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Privacy Policy Modal */}
				{showModal && (
					<div class="privacy-modal show" onClick={this.handleModalBackgroundClick}>
						<div class="privacy-modal-content">
							<button class="privacy-modal-close" onClick={this.closeModal}>
								Close
							</button>
							<h2>Privacy Policy</h2>

							<p>
								<strong>Last Updated:</strong> December 2025
							</p>

							<h3>Analytics and Data Collection</h3>
							<p>
								This application uses Google Firebase Analytics and Performance Monitoring to help us understand how
								users interact with the game and to improve performance and user experience.
							</p>

							<h3>What We Collect</h3>
							<p>Firebase Analytics automatically collects:</p>
							<ul>
								<li>Anonymous usage statistics (page views, game sessions, interactions)</li>
								<li>Device information (browser type, device type, screen resolution)</li>
								<li>General location data (country/region)</li>
								<li>Performance metrics (load times, app responsiveness)</li>
							</ul>

							<h3>What We Don't Collect</h3>
							<p>We do NOT collect:</p>
							<ul>
								<li>Personal identifiable information (PII)</li>
								<li>Your name, email, or contact details</li>
								<li>Precise location data</li>
								<li>Any data that can directly identify you</li>
							</ul>

							<h3>How We Use This Data</h3>
							<p>The collected data is used solely to:</p>
							<ul>
								<li>Understand how players use the game</li>
								<li>Identify and fix performance issues</li>
								<li>Improve game features and user experience</li>
								<li>Monitor app stability and crashes</li>
							</ul>

							<h3>Data Storage and Security</h3>
							<p>
								All data is processed and stored by Google Firebase in accordance with{" "}
								<a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener">
									Google's Privacy Policy
								</a>
								. Firebase implements industry-standard security measures to protect the data.
							</p>

							<h3>Your Consent</h3>
							<p>
								<strong>Analytics are only collected if you click "Accept" on the privacy notice.</strong>
							</p>
							<p>
								You can use this application without accepting analytics. By clicking "Accept," you consent to the
								anonymous data collection described above. Your choice is stored locally in your browser and can be
								cleared by clearing your browser's local storage.
							</p>
							<p>
								Since we don't collect personally identifiable information, the data collected cannot be traced back to
								individual users.
							</p>

							<h3>Third-Party Services</h3>
							<p>This application uses:</p>
							<ul>
								<li>
									<strong>Firebase Analytics:</strong> For usage analytics
								</li>
								<li>
									<strong>Firebase Performance Monitoring:</strong> For performance metrics
								</li>
							</ul>

							<h3>Changes to This Policy</h3>
							<p>
								We may update this privacy policy from time to time. Any changes will be reflected on this page with an
								updated "Last Updated" date.
							</p>

							<h3>Contact</h3>
							<p>
								If you have questions about this privacy policy, please visit the{" "}
								<a href="https://github.com/lloydevans/pixi-minesweeper" target="_blank" rel="noopener">
									project repository
								</a>
								.
							</p>
						</div>
					</div>
				)}

				{/* Privacy Policy Link (always visible) */}
				<div class="privacy-link">
					<a href="#" onClick={this.showModal}>
						Privacy Policy
					</a>
				</div>
			</div>
		);
	}
}
