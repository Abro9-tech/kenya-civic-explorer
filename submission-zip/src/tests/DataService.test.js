// Test suite for DataService
import { DataService } from '../services/DataService.js';

describe('DataService', () => {
    let dataService;

    beforeEach(() => {
        dataService = new DataService();
    });

    describe('calculateStatistics', () => {
        test('calculates statistics correctly', () => {
            const mockData = [
                { name: 'Nairobi', type: 'county' },
                { name: 'Westlands', type: 'constituency' },
                { name: 'Parklands', type: 'ward' },
                { name: 'Highridge', type: 'ward' }
            ];

            const stats = dataService.calculateStatistics(mockData);

            expect(stats).toEqual({
                counties: 1,
                constituencies: 1,
                wards: 2,
                total: 4
            });
        });

        test('handles empty data', () => {
            const stats = dataService.calculateStatistics([]);

            expect(stats).toEqual({
                counties: 0,
                constituencies: 0,
                wards: 0,
                total: 0
            });
        });
    });

    describe('getUniqueCounties', () => {
        test('returns unique sorted counties', () => {
            const mockData = [
                { name: 'Area 1', county: 'Nairobi' },
                { name: 'Area 2', county: 'Mombasa' },
                { name: 'Area 3', county: 'Nairobi' },
                { name: 'Area 4', county: 'Kisumu' }
            ];

            const counties = dataService.getUniqueCounties(mockData);

            expect(counties).toEqual(['Kisumu', 'Mombasa', 'Nairobi']);
        });

        test('handles empty data', () => {
            const counties = dataService.getUniqueCounties([]);
            expect(counties).toEqual([]);
        });

        test('filters out items without county', () => {
            const mockData = [
                { name: 'Area 1', county: 'Nairobi' },
                { name: 'Area 2' }, // No county
                { name: 'Area 3', county: 'Mombasa' }
            ];

            const counties = dataService.getUniqueCounties(mockData);
            expect(counties).toEqual(['Mombasa', 'Nairobi']);
        });
    });

    describe('sortData', () => {
        const mockData = [
            { name: 'Charlie', type: 'ward' },
            { name: 'Alpha', type: 'county' },
            { name: 'Bravo', type: 'constituency' }
        ];

        test('sorts by name ascending', () => {
            const sorted = dataService.sortData(mockData, 'name');
            expect(sorted.map(item => item.name)).toEqual(['Alpha', 'Bravo', 'Charlie']);
        });

        test('sorts by name descending', () => {
            const sorted = dataService.sortData(mockData, 'name-desc');
            expect(sorted.map(item => item.name)).toEqual(['Charlie', 'Bravo', 'Alpha']);
        });

        test('sorts by type', () => {
            const sorted = dataService.sortData(mockData, 'type');
            expect(sorted.map(item => item.type)).toEqual(['county', 'constituency', 'ward']);
        });

        test('does not mutate original array', () => {
            const original = [...mockData];
            dataService.sortData(mockData, 'name');
            expect(mockData).toEqual(original);
        });
    });

    describe('getMockCounties', () => {
        test('returns mock county data', () => {
            const counties = dataService.getMockCounties();
            
            expect(Array.isArray(counties)).toBe(true);
            expect(counties.length).toBeGreaterThan(0);
            expect(counties[0]).toHaveProperty('name');
            expect(counties[0]).toHaveProperty('code');
        });
    });

    describe('clearCache', () => {
        test('clears cache', () => {
            dataService.cache.set('test', 'value');
            expect(dataService.cache.has('test')).toBe(true);
            
            dataService.clearCache();
            expect(dataService.cache.has('test')).toBe(false);
        });
    });
});