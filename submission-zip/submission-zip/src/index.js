// Main Application Entry Point
import { DataService } from './services/DataService.js';
import { UIController } from './controllers/UIController.js';
import { StorageManager } from './utils/StorageManager.js';
import { debounce } from './utils/helpers.js';

class App {
    constructor() {
        this.dataService = new DataService();
        this.uiController = new UIController();
        this.storage = new StorageManager();
        this.currentData = [];
        this.filteredData = [];
    }

    async init() {
        try {
            // Offline short-circuit
            if (!navigator.onLine) {
                this.uiController.showError('You are offline. Please check your connection and retry.', true);
                this.attachRetryHandler();
                return;
            }

            // Show loading state
            this.uiController.showLoading();

            // Load data
            await this.loadData();

            // Restore saved preferences
            this.restorePreferences();

            // Setup event listeners
            this.setupEventListeners();

            // Initial render
            this.applyFilters();

        } catch (error) {
            console.error('App initialization error:', error);
            this.uiController.showError(error.message || 'Failed to initialize application. Please try again.', true);
            this.attachRetryHandler();
        } finally {
            this.uiController.hideLoading();
        }
    }

    attachRetryHandler() {
        if (this._retryHandler) {
            document.removeEventListener('click', this._retryHandler);
            this._retryHandler = null;
        }

        this._retryHandler = async (e) => {
            if (e.target && e.target.id === 'retry-btn') {
                const btn = e.target;
                try {
                    btn.disabled = true;
                    this.uiController.showLoading();
                    await this.loadData();
                    this.restorePreferences();
                    this.setupEventListeners();
                    this.applyFilters();
                } catch (err) {
                    console.error('Retry failed:', err);
                    this.uiController.showError(err.message || 'Retry failed. Please try again.', true);
                } finally {
                    this.uiController.hideLoading();
                    btn.disabled = false;
                }
            }
        };

        document.addEventListener('click', this._retryHandler);
    }

    async loadData() {
        try {
            // Fetch all Kenya area data
            this.currentData = await this.dataService.fetchAllAreas();
            
            // Update statistics
            this.updateStatistics();
            
            // Populate county filter
            this.populateCountyFilter();
            
        } catch (error) {
            console.error('Data loading error:', error);
            throw error;
        }
    }

    updateStatistics() {
        const stats = this.dataService.calculateStatistics(this.currentData);
        
        document.getElementById('stat-counties').textContent = stats.counties;
        document.getElementById('stat-constituencies').textContent = stats.constituencies;
        document.getElementById('stat-wards').textContent = stats.wards;
    }

    populateCountyFilter() {
        const counties = this.dataService.getUniqueCounties(this.currentData);
        const countySelect = document.getElementById('filter-county');
        
        counties.forEach(county => {
            const option = document.createElement('option');
            option.value = county;
            option.textContent = county;
            countySelect.appendChild(option);
        });
    }

    setupEventListeners() {
        const searchInput = document.getElementById('search-input');
        const countyFilter = document.getElementById('filter-county');
        const typeFilter = document.getElementById('filter-type');
        const sortBy = document.getElementById('sort-by');
        const resetBtn = document.getElementById('reset-filters');

        // Debounced search for performance
        const debouncedSearch = debounce(() => {
            this.applyFilters();
            this.savePreferences();
        }, 300);

        searchInput.addEventListener('input', debouncedSearch);
        
        countyFilter.addEventListener('change', () => {
            this.applyFilters();
            this.savePreferences();
        });
        
        typeFilter.addEventListener('change', () => {
            this.applyFilters();
            this.savePreferences();
        });
        
        sortBy.addEventListener('change', () => {
            this.applyFilters();
            this.savePreferences();
        });
        
        resetBtn.addEventListener('click', () => {
            this.resetFilters();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.resetFilters();
            }
        });
    }

    applyFilters() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const selectedCounty = document.getElementById('filter-county').value;
        const selectedType = document.getElementById('filter-type').value;
        const sortBy = document.getElementById('sort-by').value;

        // Filter data
        this.filteredData = this.currentData.filter(item => {
            const matchesSearch = !searchTerm || 
                item.name.toLowerCase().includes(searchTerm) ||
                (item.county && item.county.toLowerCase().includes(searchTerm));
            
            const matchesCounty = !selectedCounty || item.county === selectedCounty;
            const matchesType = !selectedType || item.type === selectedType;
            
            return matchesSearch && matchesCounty && matchesType;
        });

        // Sort data
        this.filteredData = this.dataService.sortData(this.filteredData, sortBy);

        // Render results
        this.uiController.renderResults(this.filteredData);
    }

    resetFilters() {
        document.getElementById('search-input').value = '';
        document.getElementById('filter-county').value = '';
        document.getElementById('filter-type').value = '';
        document.getElementById('sort-by').value = 'name';
        
        this.applyFilters();
        this.storage.clearPreferences();
    }

    savePreferences() {
        const preferences = {
            search: document.getElementById('search-input').value,
            county: document.getElementById('filter-county').value,
            type: document.getElementById('filter-type').value,
            sort: document.getElementById('sort-by').value
        };
        
        this.storage.savePreferences(preferences);
    }

    restorePreferences() {
        const preferences = this.storage.loadPreferences();
        
        if (preferences) {
            if (preferences.search) {
                document.getElementById('search-input').value = preferences.search;
            }
            if (preferences.county) {
                document.getElementById('filter-county').value = preferences.county;
            }
            if (preferences.type) {
                document.getElementById('filter-type').value = preferences.type;
            }
            if (preferences.sort) {
                document.getElementById('sort-by').value = preferences.sort;
            }
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new App();
        app.init();
    });
} else {
    const app = new App();
    app.init();
}

export { App };