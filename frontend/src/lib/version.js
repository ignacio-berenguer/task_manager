/**
 * Application version.
 * MAJOR: Incremented for major releases (currently 0).
 * MINOR: Equals the most recent implemented feature number.
 */
export const APP_VERSION = {
  major: 0,
  minor: 70,
}

export const VERSION_STRING = `${APP_VERSION.major}.${String(APP_VERSION.minor).padStart(3, '0')}`
