// Test suite for helper functions
import {
    debounce,
    escapeHTML,
    isEmpty,
    formatNumber,
    calculatePercentage,
    deepClone
} from '../utils/helpers.js';

describe('Helper Functions', () => {
    
    describe('escapeHTML', () => {
        test('escapes HTML special characters', () => {
            expect(escapeHTML('<script>alert("XSS")</script>'))
                .toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
        });

        test('escapes ampersands', () => {
            expect(escapeHTML('Tom & Jerry')).toBe('Tom &amp; Jerry');
        });

        test('handles empty strings', () => {
            expect(escapeHTML('')).toBe('');
        });

        test('handles non-string input', () => {
            expect(escapeHTML(null)).toBe('');
            expect(escapeHTML(undefined)).toBe('');
            expect(escapeHTML(123)).toBe('');
        });
    });

    describe('isEmpty', () => {
        test('detects empty values', () => {
            expect(isEmpty(null)).toBe(true);
            expect(isEmpty(undefined)).toBe(true);
            expect(isEmpty('')).toBe(true);
            expect(isEmpty('   ')).toBe(true);
            expect(isEmpty([])).toBe(true);
            expect(isEmpty({})).toBe(true);
        });

        test('detects non-empty values', () => {
            expect(isEmpty('test')).toBe(false);
            expect(isEmpty([1, 2, 3])).toBe(false);
            expect(isEmpty({ key: 'value' })).toBe(false);
            expect(isEmpty(0)).toBe(false);
            expect(isEmpty(false)).toBe(false);
        });
    });

    describe('formatNumber', () => {
        test('formats numbers with thousands separator', () => {
            expect(formatNumber(1000)).toBe('1,000');
            expect(formatNumber(1000000)).toBe('1,000,000');
            expect(formatNumber(123456789)).toBe('123,456,789');
        });

        test('handles small numbers', () => {
            expect(formatNumber(100)).toBe('100');
            expect(formatNumber(0)).toBe('0');
        });
    });

    describe('calculatePercentage', () => {
        test('calculates percentage correctly', () => {
            expect(calculatePercentage(25, 100)).toBe('25.0%');
            expect(calculatePercentage(1, 3, 2)).toBe('33.33%');
            expect(calculatePercentage(50, 200)).toBe('25.0%');
        });

        test('handles zero total', () => {
            expect(calculatePercentage(10, 0)).toBe('0%');
        });

        test('handles zero value', () => {
            expect(calculatePercentage(0, 100)).toBe('0.0%');
        });
    });

    describe('deepClone', () => {
        test('clones objects deeply', () => {
            const original = { a: 1, b: { c: 2 } };
            const cloned = deepClone(original);
            
            expect(cloned).toEqual(original);
            expect(cloned).not.toBe(original);
            expect(cloned.b).not.toBe(original.b);
        });

        test('clones arrays', () => {
            const original = [1, 2, [3, 4]];
            const cloned = deepClone(original);
            
            expect(cloned).toEqual(original);
            expect(cloned).not.toBe(original);
            expect(cloned[2]).not.toBe(original[2]);
        });

        test('handles primitives', () => {
            expect(deepClone(42)).toBe(42);
            expect(deepClone('test')).toBe('test');
            expect(deepClone(null)).toBe(null);
        });

        test('clones dates', () => {
            const date = new Date('2025-01-01');
            const cloned = deepClone(date);
            
            expect(cloned).toEqual(date);
            expect(cloned).not.toBe(date);
        });
    });

describe('debounce', () => {
    test('returns a function', () => {
        const mockFn = () => {};
        const debouncedFn = debounce(mockFn, 300);
        expect(typeof debouncedFn).toBe('function');
    });

    test('debounced function can be called', (done) => {
        let called = false;
        const mockFn = () => { called = true; };
        const debouncedFn = debounce(mockFn, 50);
        
        debouncedFn();
        
        setTimeout(() => {
            expect(called).toBe(true);
            done();
        }, 100);
    });
});

test('debounced function can be called', (done) => {
        let called = false;
        const mockFn = () => { called = true; };
        const debouncedFn = debounce(mockFn, 50);
        
        debouncedFn();
        
        setTimeout(() => {
            expect(called).toBe(true);
            done();
        }, 100);
    });
});