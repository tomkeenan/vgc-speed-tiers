// Minimal ambient types for the Google Identity Services (GIS) global, covering only the button /
// credential flow we use. The full library is loaded at runtime from accounts.google.com/gsi/client.

interface GsiCredentialResponse {
  credential: string;
}

interface GsiIdConfig {
  client_id: string;
  callback: (response: GsiCredentialResponse) => void;
  auto_select?: boolean;
}

interface GsiButtonConfig {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'small' | 'medium' | 'large';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  width?: number;
}

interface GsiId {
  initialize: (config: GsiIdConfig) => void;
  renderButton: (parent: HTMLElement, config: GsiButtonConfig) => void;
  disableAutoSelect: () => void;
}

interface Window {
  google?: { accounts: { id: GsiId } };
}
