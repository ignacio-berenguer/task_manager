/**
 * Shared localStorage utility factory.
 *
 * Creates a namespaced storage interface with consistent error handling.
 *
 * Usage:
 *   const storage = createStorage('my-prefix')
 *   storage.saveJSON('key', { foo: 'bar' })
 *   const val = storage.loadJSON('key', { defaultValue: true })
 */

export function createStorage(prefix) {
  const key = (name) => `${prefix}-${name}`

  return {
    saveJSON(name, value) {
      try {
        localStorage.setItem(key(name), JSON.stringify(value))
      } catch (error) {
        console.warn(`Failed to save ${key(name)} to localStorage:`, error)
      }
    },

    loadJSON(name, defaultValue = null) {
      try {
        const stored = localStorage.getItem(key(name))
        return stored ? JSON.parse(stored) : defaultValue
      } catch (error) {
        console.warn(`Failed to load ${key(name)} from localStorage:`, error)
        return defaultValue
      }
    },

    saveString(name, value) {
      try {
        localStorage.setItem(key(name), String(value))
      } catch (error) {
        console.warn(`Failed to save ${key(name)} to localStorage:`, error)
      }
    },

    loadString(name, defaultValue = null) {
      try {
        return localStorage.getItem(key(name)) ?? defaultValue
      } catch (error) {
        console.warn(`Failed to load ${key(name)} from localStorage:`, error)
        return defaultValue
      }
    },

    loadInt(name, defaultValue = 0) {
      try {
        const stored = localStorage.getItem(key(name))
        return stored ? parseInt(stored, 10) : defaultValue
      } catch (error) {
        console.warn(`Failed to load ${key(name)} from localStorage:`, error)
        return defaultValue
      }
    },

    remove(name) {
      try {
        localStorage.removeItem(key(name))
      } catch (error) {
        console.warn(`Failed to remove ${key(name)} from localStorage:`, error)
      }
    },

    removeMany(names) {
      for (const name of names) {
        this.remove(name)
      }
    },
  }
}
