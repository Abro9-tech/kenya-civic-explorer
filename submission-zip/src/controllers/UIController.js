// UI Controller - Handles all DOM manipulation and rendering
import { sanitizeHTML } from '../utils/helpers.js';

export class UIController {
    constructor() {
        this.resultsContainer = null;
    }

    /**
     * Get results container element
     * @returns {HTMLElement} Results container
     */
    getResultsContainer() {
        if (!this.resultsContainer) {
            this.resultsContainer = document.getElementById('results-container');
        }
        return this.resultsContainer;
    }

    /**
     * Show loading state
     */
    showLoading() {
        const container = this.getResultsContainer();
        container.innerHTML = `
            <div class="loading">
                <div style="font-size: 3rem; margin-bottom: 1rem;">⏳</div>
                <p>Loading Kenya area data...</p>
            </div>
        `;
    }

    /**
     * Hide loading state (remove loader if present)
     */
    hideLoading() {
        const container = this.getResultsContainer();
        const loadingEl = container.querySelector('.loading');
        if (loadingEl) loadingEl.remove();
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message, showRetry = false) {
        const container = this.getResultsContainer();
        const sanitizedMessage = sanitizeHTML(message);

        container.innerHTML = `
            <div class="error" role="alert">
                <strong>Error:</strong> ${sanitizedMessage}
                ${showRetry ? '<div style="margin-top:.75rem;"><button id="retry-btn" class="btn">Retry</button></div>' : ''}
            </div>
        `;
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        const container = this.getResultsContainer();
        container.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3>No results found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
    }

    /**
     * Render results
     * @param {Array} data - Array of area objects to render
     */
    renderResults(data) {
        const container = this.getResultsContainer();
        
        if (!data || data.length === 0) {
            this.showEmptyState();
            return;
        }

        const resultsHTML = `
            <div style="margin-bottom: 1rem; color: var(--secondary-color);">
                <strong>${data.length}</strong> result${data.length !== 1 ? 's' : ''} found
            </div>
            ${data.map(item => this.createResultCard(item)).join('')}
        `;
        
        container.innerHTML = resultsHTML;
        
        // Announce to screen readers
        this.announceResults(data.length);
    }

    /**
     * Create HTML for a single result card
     * @param {Object} item - Area object
     * @returns {string} HTML string
     */
    createResultCard(item) {
        const name = sanitizeHTML(item.name);
        const code = sanitizeHTML(item.code || 'N/A');
        const type = sanitizeHTML(item.type);
        const county = item.county ? sanitizeHTML(item.county) : '';
        const constituency = item.constituency ? sanitizeHTML(item.constituency) : '';
        
        const typeEmoji = this.getTypeEmoji(item.type);
        const typeLabel = this.getTypeLabel(item.type);
        
        return `
            <article class="result-card">
                <h3>${typeEmoji} ${name}</h3>
                <div style="margin-bottom: 1rem;">
                    <span class="badge">${typeLabel}</span>
                    ${code !== 'N/A' ? `<span class="badge">Code: ${code}</span>` : ''}
                </div>
                ${county && item.type !== 'county' ? `<p><strong>County:</strong> ${county}</p>` : ''}
                ${constituency ? `<p><strong>Constituency:</strong> ${constituency}</p>` : ''}
            </article>
        `;
    }

    /**
     * Get emoji for area type
     * @param {string} type - Area type
     * @returns {string} Emoji
     */
    getTypeEmoji(type) {
        const emojis = {
            'county': '🏛️',
            'constituency': '🏘️',
            'ward': '📍'
        };
        return emojis[type] || '📌';
    }

    /**
     * Get label for area type
     * @param {string} type - Area type
     * @returns {string} Formatted label
     */
    getTypeLabel(type) {
        return type.charAt(0).toUpperCase() + type.slice(1);
    }

    /**
     * Announce results to screen readers
     * @param {number} count - Number of results
     */
    announceResults(count) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'visually-hidden';
        announcement.textContent = `${count} result${count !== 1 ? 's' : ''} found`;
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    /**
     * Update statistics display
     * @param {Object} stats - Statistics object
     */
    updateStatistics(stats) {
        const elements = {
            'stat-counties': stats.counties,
            'stat-constituencies': stats.constituencies,
            'stat-wards': stats.wards
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                // Animate number change
                this.animateValue(element, parseInt(element.textContent) || 0, value, 500);
            }
        });
    }

    /**
     * Animate number value change
     * @param {HTMLElement} element - Target element
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {number} duration - Animation duration in ms
     */
    animateValue(element, start, end, duration) {
        const range = end - start;
        const increment = range / (duration / 16); // 60fps
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = Math.round(current);
        }, 16);
    }
}

export default UIController;