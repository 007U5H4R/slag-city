/// <reference types="vite/client" />

// Project env vars exposed to the client by Vite (must be VITE_-prefixed). Optional: absent in dev / when the
// owner hasn't set it, in which case analytics stays a no-op.
interface ImportMetaEnv {
  readonly VITE_MIXPANEL_TOKEN?: string;
}
