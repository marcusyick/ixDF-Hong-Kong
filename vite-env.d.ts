/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  // add more env variables here if needed
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
