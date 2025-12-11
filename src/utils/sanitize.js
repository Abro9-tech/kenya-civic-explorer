// File: src/utils/sanitize.js
import DOMPurify from "dompurify";

/**
 * Sanitize HTML input using DOMPurify
 * @param {string} str
 * @returns {string}
 */
export const sanitizeHTML = (str) => DOMPurify.sanitize(str);
