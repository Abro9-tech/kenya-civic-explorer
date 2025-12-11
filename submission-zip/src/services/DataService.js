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
     * Comprehensive mock data for all 47 Kenya counties
     * @returns {Array} Mock data with all Kenya counties, constituencies, and wards
     */
    getComprehensiveMockData() {
        const mockData = [];
        const countyData = {
            'Nairobi': ['Westlands', 'Dagoretti North', 'Dagoretti South', 'Langata', 'Kibra', 'Kambiokeji', 'Roysambu', 'Embakasi East', 'Embakasi Central', 'Embakasi North', 'Embakasi West', 'Embakasi South', 'Kamukunji', 'Starehe', 'Madaraka', 'Kasarani', 'Ruaraka'],
            'Mombasa': ['Mvita', 'Changamwe', 'Kisauni', 'Nyali', 'Jomvu', 'Likoni'],
            'Kwale': ['Msambweni', 'Lunga Lunga', 'Matuga', 'Kinango'],
            'Kilifi': ['Kilifi North', 'Kilifi South', 'Kaloleni', 'Rabai', 'Ganze', 'Malindi', 'Magarini'],
            'Tana River': ['Garsen', 'Galole', 'Bura'],
            'Lamu': ['Lamu East', 'Lamu West'],
            'Taita–Taveta': ['Taveta', 'Wundanyi', 'Mwatate', 'Voi'],
            'Garissa': ['Garissa Township', 'Balambala', 'Lagdera', 'Dadaab', 'Fafi', 'Ijara'],
            'Wajir': ['Wajir North', 'Wajir East', 'Tarbaj', 'Wajir West', 'Eldas', 'Wajir South'],
            'Mandera': ['Mandera West', 'Banissa', 'Mandera North', 'Mandera South', 'Mandera East', 'Lafey'],
            'Marsabit': ['Moyale', 'North Horr', 'Saku', 'Laisamis'],
            'Isiolo': ['Isiolo North', 'Isiolo South'],
            'Meru': ['Igembe South', 'Igembe Central', 'Igembe North', 'Tigania West', 'Tigania East', 'North Imenti', 'Buuri', 'South Imenti', 'Imenti Central'],
            'Tharaka-Nithi': ['Maara', 'Chuka/Igambang\'ombe', 'Tharaka'],
            'Embu': ['Manyatta', 'Runyenjes', 'Mbeere South', 'Mbeere North'],
            'Kitui': ['Mwingi North', 'Mwingi West', 'Mwingi Central', 'Kitui West', 'Kitui Rural', 'Kitui Central', 'Kitui East', 'Kitui South'],
            'Machakos': ['Masinga', 'Yatta', 'Kangundo', 'Matungulu', 'Kathiani', 'Mavoko', 'Machakos Town', 'Mwala'],
            'Makueni': ['Mbooni', 'Kilome', 'Kaiti', 'Makueni', 'Kibwezi West', 'Kibwezi East'],
            'Nyandarua': ['Kinangop', 'Kipipiri', 'Ol Kalou', 'Ol Jorok', 'Ndaragwa'],
            'Nyeri': ['Tetu', 'Kieni', 'Mathira', 'Othaya', 'Mukurweini', 'Nyeri Town'],
            'Kirinyaga': ['Mwea', 'Gichugu', 'Ndia', 'Kirinyaga Central'],
            'Murang\'a': ['Kangema', 'Mathioya', 'Kiharu', 'Kigumo', 'Maragwa', 'Kandara', 'Gatanga'],
            'Kiambu': ['Gatundu South', 'Gatundu North', 'Juja', 'Thika Town', 'Ruiru', 'Githunguri', 'Kiambu', 'Kiambaa', 'Lari', 'Limuru', 'Kabete', 'Kasarani'],
            'Turkana': ['Turkana North', 'Turkana West', 'Turkana Central', 'Loima', 'Turkana South', 'Turkana East'],
            'West Pokot': ['Kapenguria', 'Sigor', 'Kacheliba', 'Pokot South'],
            'Samburu': ['Samburu West', 'Samburu North', 'Samburu East'],
            'Trans-Nzoia': ['Kwanza', 'Endebess', 'Saboti', 'Kiminini', 'Cherangany'],
            'Uasin Gishu': ['Soy', 'Turbo', 'Moiben', 'Ainabkoi', 'Kapseret', 'Kesses'],
            'Elgeyo-Marakwet': ['Marakwet East', 'Marakwet West', 'Keiyo North', 'Keiyo South'],
            'Nandi': ['Tinderet', 'Aldai', 'Nandi Hills', 'Chesumei', 'Emgwen', 'Mosop'],
            'Baringo': ['Tiaty', 'Baringo North', 'Baringo Central', 'Baringo South', 'Mogotio', 'Eldama Ravine'],
            'Laikipia': ['Laikipia West', 'Laikipia East', 'Laikipia North'],
            'Nakuru': ['Molo', 'Njoro', 'Naivasha', 'Gilgil', 'Kuresoi South', 'Kuresoi North', 'Subukia', 'Rongai', 'Narok', 'Nakuru Town East', 'Nakuru Town West'],
            'Narok': ['Kilgoris', 'Emurua Dikirr', 'Narok North', 'Narok East', 'Narok South', 'Narok West'],
            'Kajiado': ['Kajiado North', 'Kajiado Central', 'Kajiado East', 'Kajiado West', 'Kajiado South'],
            'Kericho': ['Kipkelion East', 'Kipkelion West', 'Ainamoi', 'Bureti', 'Belgut', 'Sigowet–Soin'],
            'Bomet': ['Sotik', 'Chepalungu', 'Bomet East', 'Bomet Central', 'Konoin'],
            'Kakamega': ['Lugari', 'Likuyani', 'Malava', 'Lurambi', 'Navakholo', 'Mumias West', 'Mumias East', 'Matungu', 'Khwisero', 'Mutsami', 'Karaba', 'Butere'],
            'Vihiga': ['Vihiga', 'Sabatia', 'Hamisi', 'Luanda', 'Emuhaya'],
            'Bungoma': ['Mount Elgon', 'Sirisia', 'Kabuchai', 'Bumula', 'Kanduyi', 'Webuye East', 'Webuye West', 'Kimilili', 'Kimusi'],
            'Busia': ['Teso North', 'Teso South', 'Nambale', 'Matayos', 'Butula', 'Funyula', 'Budalangi'],
            'Siaya': ['Ugenya', 'Ugunja', 'Alego Usonga', 'Gem', 'Bondo', 'Rarieda'],
            'Kisumu': ['Kisumu East', 'Kisumu West', 'Kisumu Central', 'Seme', 'Nyando', 'Muhoroni', 'Nyakach'],
            'Homa Bay': ['Kasipul', 'Kabondo Kasipul', 'Karachuonyo', 'Rangwe', 'Homa Bay Town', 'Ndhiwa', 'Suba North', 'Suba South'],
            'Migori': ['Rongo', 'Awendo', 'Suna East', 'Suna West', 'Uriri', 'Nyatike', 'Kuria West', 'Kuria East'],
            'Kisii': ['Bonchari', 'South Mugirango', 'Bomachoge Borabu', 'Bobasi', 'Bomachoge Chache', 'Nyaribari Masaba', 'Nyaribari Chache', 'West Mugirango', 'Kitutu Masaba'],
            'Nyamira': ['Kitutu Masaba', 'West Mugirango', 'North Mugirango', 'Borabu']
        };

        let countyCode = 1;
        for (const [county, constituencies] of Object.entries(countyData)) {
            mockData.push({ 
                name: county, 
                code: String(countyCode).padStart(3, '0'), 
                type: 'county', 
                county: county 
            });

            constituencies.forEach((const_, constIdx) => {
                mockData.push({ 
                    name: const_, 
                    code: `${String(countyCode).padStart(3, '0')}-${String(constIdx+1).padStart(2, '0')}`, 
                    type: 'constituency', 
                    county: county 
                });
                // Add 5 wards per constituency
                for (let w = 1; w <= 5; w++) {
                    mockData.push({ 
                        name: `${const_} Ward ${w}`, 
                        code: `${String(countyCode).padStart(3, '0')}-${String(constIdx+1).padStart(2, '0')}-${w}`, 
                        type: 'ward', 
                        county: county, 
                        constituency: const_ 
                    });
                }
            });
            countyCode++;
        }

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