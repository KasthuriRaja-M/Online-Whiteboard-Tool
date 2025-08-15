/**
 * Utility functions for the Online Whiteboard Tool
 */

class Utils {
    /**
     * Convert screen coordinates to canvas coordinates
     * @param {number} x - Screen X coordinate
     * @param {number} y - Screen Y coordinate
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @returns {Object} Canvas coordinates {x, y}
     */
    static screenToCanvas(x, y, canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        return {
            x: (x - rect.left) * scaleX,
            y: (y - rect.top) * scaleY
        };
    }

    /**
     * Convert canvas coordinates to screen coordinates
     * @param {number} x - Canvas X coordinate
     * @param {number} y - Canvas Y coordinate
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @returns {Object} Screen coordinates {x, y}
     */
    static canvasToScreen(x, y, canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = rect.width / canvas.width;
        const scaleY = rect.height / canvas.height;
        
        return {
            x: x * scaleX + rect.left,
            y: y * scaleY + rect.top
        };
    }

    /**
     * Get distance between two points
     * @param {number} x1 - First point X
     * @param {number} y1 - First point Y
     * @param {number} x2 - Second point X
     * @param {number} y2 - Second point Y
     * @returns {number} Distance
     */
    static distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    /**
     * Get angle between two points
     * @param {number} x1 - First point X
     * @param {number} y1 - First point Y
     * @param {number} x2 - Second point X
     * @param {number} y2 - Second point Y
     * @returns {number} Angle in radians
     */
    static angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    /**
     * Convert degrees to radians
     * @param {number} degrees - Degrees
     * @returns {number} Radians
     */
    static toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Convert radians to degrees
     * @param {number} radians - Radians
     * @returns {number} Degrees
     */
    static toDegrees(radians) {
        return radians * (180 / Math.PI);
    }

    /**
     * Clamp a value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Clamped value
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Linear interpolation between two values
     * @param {number} a - Start value
     * @param {number} b - End value
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} Interpolated value
     */
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * Generate a unique ID
     * @returns {string} Unique ID
     */
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Deep clone an object
     * @param {Object} obj - Object to clone
     * @returns {Object} Cloned object
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = Utils.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    /**
     * Debounce a function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle a function
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Format file size
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get file extension from filename
     * @param {string} filename - Filename
     * @returns {string} File extension
     */
    static getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
    }

    /**
     * Check if a point is inside a rectangle
     * @param {number} x - Point X
     * @param {number} y - Point Y
     * @param {number} rectX - Rectangle X
     * @param {number} rectY - Rectangle Y
     * @param {number} rectWidth - Rectangle width
     * @param {number} rectHeight - Rectangle height
     * @returns {boolean} True if point is inside rectangle
     */
    static pointInRect(x, y, rectX, rectY, rectWidth, rectHeight) {
        return x >= rectX && x <= rectX + rectWidth && 
               y >= rectY && y <= rectY + rectHeight;
    }

    /**
     * Check if a point is inside a circle
     * @param {number} x - Point X
     * @param {number} y - Point Y
     * @param {number} centerX - Circle center X
     * @param {number} centerY - Circle center Y
     * @param {number} radius - Circle radius
     * @returns {boolean} True if point is inside circle
     */
    static pointInCircle(x, y, centerX, centerY, radius) {
        const distance = Utils.distance(x, y, centerX, centerY);
        return distance <= radius;
    }

    /**
     * Get bounding box of points
     * @param {Array} points - Array of points [{x, y}, ...]
     * @returns {Object} Bounding box {x, y, width, height}
     */
    static getBoundingBox(points) {
        if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
        
        let minX = points[0].x;
        let minY = points[0].y;
        let maxX = points[0].x;
        let maxY = points[0].y;
        
        for (let i = 1; i < points.length; i++) {
            minX = Math.min(minX, points[i].x);
            minY = Math.min(minY, points[i].y);
            maxX = Math.max(maxX, points[i].x);
            maxY = Math.max(maxY, points[i].y);
        }
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    /**
     * Color utilities
     */
    static Colors = {
        /**
         * Convert hex color to RGB
         * @param {string} hex - Hex color (#RRGGBB)
         * @returns {Object} RGB values {r, g, b}
         */
        hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        },

        /**
         * Convert RGB to hex color
         * @param {number} r - Red value (0-255)
         * @param {number} g - Green value (0-255)
         * @param {number} b - Blue value (0-255)
         * @returns {string} Hex color
         */
        rgbToHex(r, g, b) {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        },

        /**
         * Convert RGB to HSL
         * @param {number} r - Red value (0-255)
         * @param {number} g - Green value (0-255)
         * @param {number} b - Blue value (0-255)
         * @returns {Object} HSL values {h, s, l}
         */
        rgbToHsl(r, g, b) {
            r /= 255;
            g /= 255;
            b /= 255;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;

            if (max === min) {
                h = s = 0;
            } else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }

            return { h: h * 360, s: s * 100, l: l * 100 };
        },

        /**
         * Convert HSL to RGB
         * @param {number} h - Hue (0-360)
         * @param {number} s - Saturation (0-100)
         * @param {number} l - Lightness (0-100)
         * @returns {Object} RGB values {r, g, b}
         */
        hslToRgb(h, s, l) {
            h /= 360;
            s /= 100;
            l /= 100;

            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            let r, g, b;

            if (s === 0) {
                r = g = b = l;
            } else {
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                r = hue2rgb(p, q, h + 1/3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1/3);
            }

            return {
                r: Math.round(r * 255),
                g: Math.round(g * 255),
                b: Math.round(b * 255)
            };
        },

        /**
         * Get contrasting color (black or white) for a given background color
         * @param {string} hexColor - Background hex color
         * @returns {string} Contrasting color (#000000 or #ffffff)
         */
        getContrastColor(hexColor) {
            const rgb = Utils.Colors.hexToRgb(hexColor);
            if (!rgb) return '#000000';
            
            const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
            return brightness > 128 ? '#000000' : '#ffffff';
        },

        /**
         * Lighten a color by a percentage
         * @param {string} hexColor - Hex color
         * @param {number} percent - Percentage to lighten (0-100)
         * @returns {string} Lightened hex color
         */
        lighten(hexColor, percent) {
            const rgb = Utils.Colors.hexToRgb(hexColor);
            if (!rgb) return hexColor;
            
            const hsl = Utils.Colors.rgbToHsl(rgb.r, rgb.g, rgb.b);
            hsl.l = Math.min(100, hsl.l + percent);
            
            const newRgb = Utils.Colors.hslToRgb(hsl.h, hsl.s, hsl.l);
            return Utils.Colors.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
        },

        /**
         * Darken a color by a percentage
         * @param {string} hexColor - Hex color
         * @param {number} percent - Percentage to darken (0-100)
         * @returns {string} Darkened hex color
         */
        darken(hexColor, percent) {
            const rgb = Utils.Colors.hexToRgb(hexColor);
            if (!rgb) return hexColor;
            
            const hsl = Utils.Colors.rgbToHsl(rgb.r, rgb.g, rgb.b);
            hsl.l = Math.max(0, hsl.l - percent);
            
            const newRgb = Utils.Colors.hslToRgb(hsl.h, hsl.s, hsl.l);
            return Utils.Colors.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
        }
    };

    /**
     * Local storage utilities
     */
    static Storage = {
        /**
         * Save data to localStorage
         * @param {string} key - Storage key
         * @param {any} data - Data to save
         */
        save(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
            } catch (error) {
                console.warn('Failed to save to localStorage:', error);
            }
        },

        /**
         * Load data from localStorage
         * @param {string} key - Storage key
         * @param {any} defaultValue - Default value if key doesn't exist
         * @returns {any} Loaded data or default value
         */
        load(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.warn('Failed to load from localStorage:', error);
                return defaultValue;
            }
        },

        /**
         * Remove data from localStorage
         * @param {string} key - Storage key
         */
        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.warn('Failed to remove from localStorage:', error);
            }
        },

        /**
         * Clear all localStorage data
         */
        clear() {
            try {
                localStorage.clear();
            } catch (error) {
                console.warn('Failed to clear localStorage:', error);
            }
        }
    };

    /**
     * Event utilities
     */
    static Events = {
        /**
         * Add event listener with error handling
         * @param {Element} element - DOM element
         * @param {string} event - Event type
         * @param {Function} handler - Event handler
         * @param {Object} options - Event options
         */
        addListener(element, event, handler, options = {}) {
            try {
                element.addEventListener(event, handler, options);
            } catch (error) {
                console.warn('Failed to add event listener:', error);
            }
        },

        /**
         * Remove event listener
         * @param {Element} element - DOM element
         * @param {string} event - Event type
         * @param {Function} handler - Event handler
         * @param {Object} options - Event options
         */
        removeListener(element, event, handler, options = {}) {
            try {
                element.removeEventListener(event, handler, options);
            } catch (error) {
                console.warn('Failed to remove event listener:', error);
            }
        }
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
