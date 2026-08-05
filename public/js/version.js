/**
 * Bump APP_VERSION for any change to code, styles or markup, and KB_VERSION for
 * any change to the data files. The test suite asserts these stay in step with
 * asset-manifest.json, service-worker.js and the data files themselves.
 */
export const APP_VERSION = '1.0.0';
export const KB_VERSION = '1.0.0';
export const CACHE_PREFIX = 'rv-ai-playa';
export const CACHE_NAME = `${CACHE_PREFIX}-v${APP_VERSION}`;
