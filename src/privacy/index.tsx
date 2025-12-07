// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h, render } from 'preact';
import { PrivacyComponent } from './privacy-component';

// Create and mount the privacy component
const container = document.createElement('div');
container.id = 'privacy-container';
document.body.appendChild(container);
render(<PrivacyComponent />, container);
