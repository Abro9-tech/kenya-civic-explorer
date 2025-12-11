// Storage Manager - Handles localStorage operations
import { sanitizeHTML } from './helpers.js';
export class StorageManager {
    constructor() {
        this.storageKey = 'kenyaCivicExplorer';
        this.preferencesKey = `${this.storageKey}_preferences`;
    }

    /**
     * Check if localStorage is available
     * @returns {boolean} True if localStorage is available
     */
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Save user preferences
     * @param {Object} preferences - Preferences object
     * @returns {boolean} Success status
     */
    savePreferences(preferences) {
        if (!this.isStorageAvailable()) {
            console.warn('localStorage not available');
            return false;
        }

        try {
            const data = {
                preferences,
                timestamp: Date.now()
            };
            localStorage.setItem(this.preferencesKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving preferences:', error);
            return false;
        }
    }

    /**
     * Load user preferences
     * @returns {Object|null} Preferences object or null
     */
    loadPreferences() {
        if (!this.isStorageAvailable()) {
            return null;
        }

        try {
            const stored = localStorage.getItem(this.preferencesKey);
            if (!stored) return null;

            const data = JSON.parse(stored);
            
            // Check if data is stale (older than 7 days)
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
            if (Date.now() - data.timestamp > maxAge) {
                this.clearPreferences();
                return null;
            }

            // Sanitize any string fields in preferences before returning
            if (data.preferences && typeof data.preferences === 'object') {
                Object.keys(data.preferences).forEach(k => {
                    if (typeof data.preferences[k] === 'string') {
                        data.preferences[k] = sanitizeHTML(data.preferences[k]);
                    }
                });
            }

            return data.preferences;
        } catch (error) {
            console.error('Error loading preferences:', error);
            return null;
        }
    }

    /**
     * Clear user preferences
     * @returns {boolean} Success status
     */
    clearPreferences() {
        if (!this.isStorageAvailable()) {
            return false;
        }

        try {
            localStorage.removeItem(this.preferencesKey);
            return true;
        } catch (error) {
            console.error('Error clearing preferences:', error);
            return false;
        }
    }

    /**
     * Save data to localStorage
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {boolean} Success status
     */
    saveData(key, value) {
        if (!this.isStorageAvailable()) {
            return false;
        }

        try {
            const fullKey = `${this.storageKey}_${key}`;
            localStorage.setItem(fullKey, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    /**
     * Load data from localStorage
     * @param {string} key - Storage key
     * @returns {*} Stored value or null
     */
    loadData(key) {
        if (!this.isStorageAvailable()) {
            return null;
        }

        try {
            const fullKey = `${this.storageKey}_${key}`;
            const stored = localStorage.getItem(fullKey);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error loading data:', error);
            return null;
        }
    }

    /**
     * Clear all app data from localStorage
     * @returns {boolean} Success status
     */
    clearAllData() {
        if (!this.isStorageAvailable()) {
            return false;
        }

        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.storageKey)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Error clearing all data:', error);
            return false;
        }
    }

    /**
     * Get storage usage info
     * @returns {Object} Storage usage information
     */
    getStorageInfo() {
        if (!this.isStorageAvailable()) {
            return { available: false };
        }

        try {
            let totalSize = 0;
            const keys = Object.keys(localStorage);
            
            keys.forEach(key => {
                if (key.startsWith(this.storageKey)) {
                    totalSize += localStorage.getItem(key).length;
                }
            });

            return {
                available: true,
                itemCount: keys.filter(k => k.startsWith(this.storageKey)).length,
                totalSize: totalSize,
                totalSizeKB: (totalSize / 1024).toFixed(2)
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return { available: true, error: true };
        }
    }
}

export default StorageManager;