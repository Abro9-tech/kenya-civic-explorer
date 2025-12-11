// Data Service - Handles all API interactions and data processing
export class DataService {
    constructor() {
        this.apiBase = 'https://kenyaareadata.github.io/kenya-areas/api';
        this.cache = new Map();
        this.useMockData = false; // Use real API data by default
        console.log('DataService initialized with useMockData:', this.useMockData);
    }

    /**
     * Robust fetch wrapper with timeout and retry support
     */
    async _fetchJSON(url, options = {}, timeout = 8000, retries = 2) {
        let attempt = 0;
        const backoff = attempt => Math.min(1000 * 2 ** attempt, 8000);

        while (attempt <= retries) {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);
            try {
                const res = await fetch(url, { 
                    ...options, 
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        ...options.headers
                    }
                });
                clearTimeout(id);

                if (!res.ok) {
                    throw new Error(`${res.status} ${res.statusText}`);
                }

                const contentType = res.headers.get('content-type') || '';
                return contentType.includes('application/json') 
                    ? await res.json() 
                    : await res.text();

            } catch (err) {
                clearTimeout(id);
                const isNetworkError = err.name === 'AbortError' || err instanceof TypeError;
                if (attempt < retries && isNetworkError) {
                    const delay = backoff(attempt);
                    await new Promise(r => setTimeout(r, delay));
                    attempt += 1;
                    continue;
                }
                throw err;
            }
        }
    }

    /**
     * Fetch list of all counties
     * @returns {Promise<Array>} Array of county objects
     */
    async fetchCounties() {
        try {
            console.log('Using mock counties data');
            return this.getMockCounties();
        } catch (error) {
            console.error('Error in fetchCounties:', error);
            return this.getMockCounties();
        }
    }

    /**
     * Mock data fallback for development/testing
     * @returns {Array} Mock county data with name and code
     */
    getMockCounties() {
        return [
            { name: 'Nairobi', code: '047' },
            { name: 'Mombasa', code: '001' },
            { name: 'Kiambu', code: '022' },
            { name: 'Nakuru', code: '032' },
            { name: 'Kisumu', code: '042' },
            { name: 'Kakamega', code: '037' },
            { name: 'Bungoma', code: '039' },
            { name: 'Uasin Gishu', code: '027' },
            { name: 'Meru', code: '012' },
            { name: 'Kisii', code: '045' },
            { name: 'Machakos', code: '016' },
            { name: 'Kitui', code: '015' },
            { name: 'Kilifi', code: '003' },
            { name: 'Nyeri', code: '019' },
            { name: 'Nandi', code: '029' },
            { name: 'Kericho', code: '035' },
            { name: 'Bomet', code: '036' },
            { name: 'Laikipia', code: '031' },
            { name: 'Narok', code: '033' },
            { name: 'Kajiado', code: '034' },
            { name: 'Makueni', code: '017' },
            { name: 'Trans Nzoia', code: '026' },
            { name: 'Turkana', code: '023' },
            { name: 'West Pokot', code: '024' },
            { name: 'Samburu', code: '025' },
            { name: 'Marsabit', code: '010' },
            { name: 'Isiolo', code: '009' },
            { name: 'Tharaka-Nithi', code: '013' },
            { name: 'Embu', code: '014' },
            { name: 'Kirinyaga', code: '020' },
            { name: 'Murang\\'a', code: '021' },
            { name: 'Nyandarua', code: '018' },
            { name: 'Kwale', code: '002' },
            { name: 'Tana River', code: '006' },
            { name: 'Lamu', code: '005' },
            { name: 'Taita Taveta', code: '004' },
            { name: 'Garissa', code: '007' },
            { name: 'Wajir', code: '008' },
            { name: 'Mandera', code: '011' },
            { name: 'Migori', code: '044' },
            { name: 'Nyamira', code: '046' },
            { name: 'Homa Bay', code: '043' },
            { name: 'Siaya', code: '041' },
            { name: 'Busia', code: '040' },
            { name: 'Vihiga', code: '038' },
            { name: 'Baringo', code: '030' },
            { name: 'Elgeyo Marakwet', code: '028' }
        ].map(county => ({
            name: county.name,
            code: county.code,
            type: 'county'
        }));
    }

    // ... (keep other methods as they are) ...

    clearCache() {
        this.cache.clear();
    }
}

export default DataService;