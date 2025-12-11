// Data Service - Handles all API interactions and data processing
export class DataService {
    constructor() {
        this.apiBase = 'https://kenyaareadata.vercel.app/api';
        this.cache = new Map();
        this.useMockData = true; // Use mock data by default to ensure UI works
    }

    /**
     * Robust fetch wrapper with timeout and retry support
     * @param {string} url
     * @param {Object} options
     * @param {number} timeout in ms
     * @param {number} retries number of retries on network failure (not HTTP errors)
     */
    async _fetchJSON(url, options = {}, timeout = 8000, retries = 2) {
        let attempt = 0;
        const backoff = attempt => Math.min(1000 * 2 ** attempt, 8000);

        while (attempt <= retries) {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);
            try {
                const res = await fetch(url, { ...options, signal: controller.signal });
                clearTimeout(id);

                if (!res.ok) {
                    // Do not retry on HTTP status errors - let caller decide
                    throw new Error(`${res.status} ${res.statusText}`);
                }

                const contentType = res.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    return await res.json();
                }

                // If not JSON, return text
                return await res.text();

            } catch (err) {
                clearTimeout(id);
                // If aborted or network error (TypeError) and we have retries left, retry
                const isNetworkError = err.name === 'AbortError' || err instanceof TypeError;
                if (attempt < retries && isNetworkError) {
                    const delay = backoff(attempt);
                    await new Promise(r => setTimeout(r, delay));
                    attempt += 1;
                    continue;
                }

                // No more retries or HTTP error - rethrow
                throw err;
            }
        }
    }

    /**
     * Fetch all Kenya area data (counties, constituencies, wards)
     * @returns {Promise<Array>} Array of area objects
     */
    async fetchAllAreas() {
        try {
            // For demo purposes, use comprehensive mock data
            if (this.useMockData) {
                return this.getComprehensiveMockData();
            }

            // Check cache first
            if (this.cache.has('allAreas')) {
                return this.cache.get('allAreas');
            }

            const counties = await this.fetchCounties();
            const allAreas = [];

            // Add counties as individual items
            counties.forEach(county => {
                allAreas.push({
                    name: county.name,
                    code: county.code,
                    type: 'county',
                    county: county.name
                });
            });

            // Fetch constituencies and wards for each county
            for (const county of counties) {
                try {
                    const areas = await this.fetchAreasByCounty(county.name);
                    allAreas.push(...areas);
                } catch (error) {
                    console.warn(`Failed to fetch areas for ${county.name}:`, error);
                }
            }

            // Cache the results
            this.cache.set('allAreas', allAreas);
            
            return allAreas;

        } catch (error) {
            console.error('Error fetching all areas:', error);
            // Fallback to mock data
            return this.getComprehensiveMockData();
        }
    }

    /**
     * Comprehensive mock data for demo
     * @returns {Array} Mock data with realistic Kenya administrative areas
     */
    getComprehensiveMockData() {
        const mockData = [];

        // Nairobi County
        mockData.push({ name: 'Nairobi', code: '047', type: 'county', county: 'Nairobi' });
        mockData.push({ name: 'Westlands', code: '047-01', type: 'constituency', county: 'Nairobi' });
        mockData.push({ name: 'Kitisuru', code: '047-01-01', type: 'ward', county: 'Nairobi', constituency: 'Westlands' });
        mockData.push({ name: 'Parklands/Highridge', code: '047-01-02', type: 'ward', county: 'Nairobi', constituency: 'Westlands' });
        mockData.push({ name: 'Karura', code: '047-01-03', type: 'ward', county: 'Nairobi', constituency: 'Westlands' });
        mockData.push({ name: 'Kangemi', code: '047-01-04', type: 'ward', county: 'Nairobi', constituency: 'Westlands' });
        mockData.push({ name: 'Mountain View', code: '047-01-05', type: 'ward', county: 'Nairobi', constituency: 'Westlands' });

        mockData.push({ name: 'Dagoretti North', code: '047-02', type: 'constituency', county: 'Nairobi' });
        mockData.push({ name: 'Kilimani', code: '047-02-01', type: 'ward', county: 'Nairobi', constituency: 'Dagoretti North' });
        mockData.push({ name: 'Kawangware', code: '047-02-02', type: 'ward', county: 'Nairobi', constituency: 'Dagoretti North' });
        mockData.push({ name: 'Gatina', code: '047-02-03', type: 'ward', county: 'Nairobi', constituency: 'Dagoretti North' });
        mockData.push({ name: 'Kileleshwa', code: '047-02-04', type: 'ward', county: 'Nairobi', constituency: 'Dagoretti North' });
        mockData.push({ name: 'Kabiro', code: '047-02-05', type: 'ward', county: 'Nairobi', constituency: 'Dagoretti North' });

        mockData.push({ name: 'Langata', code: '047-03', type: 'constituency', county: 'Nairobi' });
        mockData.push({ name: 'Karen', code: '047-03-01', type: 'ward', county: 'Nairobi', constituency: 'Langata' });
        mockData.push({ name: 'Nairobi West', code: '047-03-02', type: 'ward', county: 'Nairobi', constituency: 'Langata' });
        mockData.push({ name: 'Mugumo-ini', code: '047-03-03', type: 'ward', county: 'Nairobi', constituency: 'Langata' });
        mockData.push({ name: 'South C', code: '047-03-04', type: 'ward', county: 'Nairobi', constituency: 'Langata' });
        mockData.push({ name: 'Nyayo Highrise', code: '047-03-05', type: 'ward', county: 'Nairobi', constituency: 'Langata' });

        // Mombasa County
        mockData.push({ name: 'Mombasa', code: '001', type: 'county', county: 'Mombasa' });
        mockData.push({ name: 'Mvita', code: '001-01', type: 'constituency', county: 'Mombasa' });
        mockData.push({ name: 'Mji Wa Kale/Makadara', code: '001-01-01', type: 'ward', county: 'Mombasa', constituency: 'Mvita' });
        mockData.push({ name: 'Tudor', code: '001-01-02', type: 'ward', county: 'Mombasa', constituency: 'Mvita' });
        mockData.push({ name: 'Tononoka', code: '001-01-03', type: 'ward', county: 'Mombasa', constituency: 'Mvita' });
        mockData.push({ name: 'Shimanzi/Ganjoni', code: '001-01-04', type: 'ward', county: 'Mombasa', constituency: 'Mvita' });
        mockData.push({ name: 'Majengo', code: '001-01-05', type: 'ward', county: 'Mombasa', constituency: 'Mvita' });

        mockData.push({ name: 'Changamwe', code: '001-02', type: 'constituency', county: 'Mombasa' });
        mockData.push({ name: 'Port Reitz', code: '001-02-01', type: 'ward', county: 'Mombasa', constituency: 'Changamwe' });
        mockData.push({ name: 'Kipevu', code: '001-02-02', type: 'ward', county: 'Mombasa', constituency: 'Changamwe' });
        mockData.push({ name: 'Airport', code: '001-02-03', type: 'ward', county: 'Mombasa', constituency: 'Changamwe' });
        mockData.push({ name: 'Changamwe', code: '001-02-04', type: 'ward', county: 'Mombasa', constituency: 'Changamwe' });
        mockData.push({ name: 'Chaani', code: '001-02-05', type: 'ward', county: 'Mombasa', constituency: 'Changamwe' });

        // Kiambu County
        mockData.push({ name: 'Kiambu', code: '022', type: 'county', county: 'Kiambu' });
        mockData.push({ name: 'Kikuyu', code: '022-01', type: 'constituency', county: 'Kiambu' });
        mockData.push({ name: 'Karai', code: '022-01-01', type: 'ward', county: 'Kiambu', constituency: 'Kikuyu' });
        mockData.push({ name: 'Nachu', code: '022-01-02', type: 'ward', county: 'Kiambu', constituency: 'Kikuyu' });
        mockData.push({ name: 'Sigona', code: '022-01-03', type: 'ward', county: 'Kiambu', constituency: 'Kikuyu' });
        mockData.push({ name: 'Kikuyu', code: '022-01-04', type: 'ward', county: 'Kiambu', constituency: 'Kikuyu' });
        mockData.push({ name: 'Kinoo', code: '022-01-05', type: 'ward', county: 'Kiambu', constituency: 'Kikuyu' });

        mockData.push({ name: 'Thika Town', code: '022-02', type: 'constituency', county: 'Kiambu' });
        mockData.push({ name: 'Township', code: '022-02-01', type: 'ward', county: 'Kiambu', constituency: 'Thika Town' });
        mockData.push({ name: 'Kamenu', code: '022-02-02', type: 'ward', county: 'Kiambu', constituency: 'Thika Town' });
        mockData.push({ name: 'Hospital', code: '022-02-03', type: 'ward', county: 'Kiambu', constituency: 'Thika Town' });
        mockData.push({ name: 'Gatuanyaga', code: '022-02-04', type: 'ward', county: 'Kiambu', constituency: 'Thika Town' });
        mockData.push({ name: 'Ngoliba', code: '022-02-05', type: 'ward', county: 'Kiambu', constituency: 'Thika Town' });

        // Nakuru County
        mockData.push({ name: 'Nakuru', code: '032', type: 'county', county: 'Nakuru' });
        mockData.push({ name: 'Nakuru Town East', code: '032-01', type: 'constituency', county: 'Nakuru' });
        mockData.push({ name: 'Biashara', code: '032-01-01', type: 'ward', county: 'Nakuru', constituency: 'Nakuru Town East' });
        mockData.push({ name: 'Flamingo', code: '032-01-02', type: 'ward', county: 'Nakuru', constituency: 'Nakuru Town East' });
        mockData.push({ name: 'Menengai West', code: '032-01-03', type: 'ward', county: 'Nakuru', constituency: 'Nakuru Town East' });
        mockData.push({ name: 'Nakuru East', code: '032-01-04', type: 'ward', county: 'Nakuru', constituency: 'Nakuru Town East' });
        mockData.push({ name: 'Kivumbini', code: '032-01-05', type: 'ward', county: 'Nakuru', constituency: 'Nakuru Town East' });

        // Kisumu County
        mockData.push({ name: 'Kisumu', code: '042', type: 'county', county: 'Kisumu' });
        mockData.push({ name: 'Kisumu East', code: '042-01', type: 'constituency', county: 'Kisumu' });
        mockData.push({ name: 'Kajulu', code: '042-01-01', type: 'ward', county: 'Kisumu', constituency: 'Kisumu East' });
        mockData.push({ name: 'Kolwa East', code: '042-01-02', type: 'ward', county: 'Kisumu', constituency: 'Kisumu East' });
        mockData.push({ name: 'Manyatta B', code: '042-01-03', type: 'ward', county: 'Kisumu', constituency: 'Kisumu East' });
        mockData.push({ name: 'Nyalenda A', code: '042-01-04', type: 'ward', county: 'Kisumu', constituency: 'Kisumu East' });
        mockData.push({ name: 'Kolwa Central', code: '042-01-05', type: 'ward', county: 'Kisumu', constituency: 'Kisumu East' });

        mockData.push({ name: 'Kisumu West', code: '042-02', type: 'constituency', county: 'Kisumu' });
        mockData.push({ name: 'Central Kisumu', code: '042-02-01', type: 'ward', county: 'Kisumu', constituency: 'Kisumu West' });
        mockData.push({ name: 'Kisumu North', code: '042-02-02', type: 'ward', county: 'Kisumu', constituency: 'Kisumu West' });
        mockData.push({ name: 'West Kisumu', code: '042-02-03', type: 'ward', county: 'Kisumu', constituency: 'Kisumu West' });
        mockData.push({ name: 'North West Kisumu', code: '042-02-04', type: 'ward', county: 'Kisumu', constituency: 'Kisumu West' });
        mockData.push({ name: 'South West Kisumu', code: '042-02-05', type: 'ward', county: 'Kisumu', constituency: 'Kisumu West' });

        return mockData;
    }

    /**
     * Fetch list of all counties
     * @returns {Promise<Array>} Array of county objects
     */
    async fetchCounties() {
        try {
            if (this.useMockData) {
                return this.getMockCounties();
            }

            const data = await this._fetchJSON(`${this.apiBase}/counties`, {}, 8000, 2);
            return (data && data.counties) ? data.counties : [];

        } catch (error) {
            console.error('Error fetching counties:', error);
            // Return mock data as fallback
            return this.getMockCounties();
        }
    }

    /**
     * Fetch constituencies and wards for a specific county
     * @param {string} countyName - Name of the county
     * @returns {Promise<Array>} Array of area objects
     */
    async fetchAreasByCounty(countyName) {
        try {
            if (this.useMockData) {
                const mock = this.getComprehensiveMockData();
                return mock.filter(item => item.county === countyName && item.type !== 'county');
            }

            const data = await this._fetchJSON(`${this.apiBase}/areas?county=${encodeURIComponent(countyName)}`, {}, 8000, 2);
            const areas = [];

            // Process constituencies
            if (data.constituencies) {
                data.constituencies.forEach(constituency => {
                    areas.push({
                        name: constituency.name,
                        code: constituency.code,
                        type: 'constituency',
                        county: countyName
                    });

                    // Process wards within constituency
                    if (constituency.wards) {
                        constituency.wards.forEach(ward => {
                            areas.push({
                                name: ward.name,
                                code: ward.code,
                                type: 'ward',
                                county: countyName,
                                constituency: constituency.name
                            });
                        });
                    }
                });
            }

            return areas;

        } catch (error) {
            console.error(`Error fetching areas for ${countyName}:`, error);
            return [];
        }
    }

    /**
     * Calculate statistics from area data
     * @param {Array} data - Array of area objects
     * @returns {Object} Statistics object
     */
    calculateStatistics(data) {
        return {
            counties: data.filter(item => item.type === 'county').length,
            constituencies: data.filter(item => item.type === 'constituency').length,
            wards: data.filter(item => item.type === 'ward').length,
            total: data.length
        };
    }

    /**
     * Get unique counties from data
     * @param {Array} data - Array of area objects
     * @returns {Array} Sorted array of unique county names
     */
    getUniqueCounties(data) {
        const counties = new Set(
            data
                .filter(item => item.county)
                .map(item => item.county)
        );
        return Array.from(counties).sort();
    }

    /**
     * Sort data by specified criteria
     * @param {Array} data - Array of area objects
     * @param {string} sortBy - Sort criteria (name, name-desc, type)
     * @returns {Array} Sorted array
     */
    sortData(data, sortBy) {
        const sorted = [...data];

        switch (sortBy) {
            case 'name':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            
            case 'name-desc':
                return sorted.sort((a, b) => b.name.localeCompare(a.name));
            
            case 'type':
                const typeOrder = { county: 1, constituency: 2, ward: 3 };
                return sorted.sort((a, b) => {
                    const typeCompare = typeOrder[a.type] - typeOrder[b.type];
                    if (typeCompare !== 0) return typeCompare;
                    return a.name.localeCompare(b.name);
                });
            
            default:
                return sorted;
        }
    }

    /**
     * Mock data fallback for development/testing
     * @returns {Array} Mock county data
     */
    getMockCounties() {
        return [
            { name: 'Nairobi', code: '047' },
            { name: 'Mombasa', code: '001' },
            { name: 'Kiambu', code: '022' },
            { name: 'Nakuru', code: '032' },
            { name: 'Kisumu', code: '042' }
        ];
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
}

export default DataService;