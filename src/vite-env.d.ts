/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the API, e.g. http://localhost:3000 (the mock server). */
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_TENANT_ID?: string;
  readonly VITE_BLUEPRINT_ID?: string;
  /** Only the real API has a version segment; leave unset for the mock. */
  readonly VITE_BLUEPRINT_VERSION_ID?: string;
  /** Comma-separated prefill source ids, in display order. Unset = all sources. */
  readonly VITE_PREFILL_SOURCES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
