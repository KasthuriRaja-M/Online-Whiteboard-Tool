/**
 * Main application for the Online Whiteboard Tool
 */

class WhiteboardApp {
    constructor() {
        this.canvasManager = null;
        this.fileOperations = null;
        this.currentTheme = 'light';
        
        this.initializeApp();
    }

    /**
     * Initialize the application
     */
    initializeApp() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApp());
        } else {
            this.setupApp();
        }
    }

    /**
     * Setup the application components
     */
    setupApp() {
        try {
            // Initialize canvas manager
            this.canvasManager = new CanvasManager('whiteboard-canvas');
            
            // Initialize file operations
            this.fileOperations = new FileOperations(this.canvasManager);
            
            // Setup UI components
            this.setupUI();
            
            // Setup theme
            this.setupTheme();
            
            // Setup settings
            this.setupSettings();
            
            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            // Check for auto-save
            this.checkAutoSave();
            
            // Enable auto-save
            this.fileOperations.enableAutoSave();
            
            console.log('Whiteboard application initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize whiteboard application:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Setup UI components
     */
    setupUI() {
        this.setupToolButtons();
        this.setupColorPicker();
        this.setupSliders();
        this.setupLineStyles();
        this.setupFillOptions();
        this.setupThemeToggle();
        this.setupFullscreen();
    }

    /**
     * Setup tool buttons
     */
    setupToolButtons() {
        const toolButtons = document.querySelectorAll('.tool-btn');
        toolButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const toolName = e.currentTarget.dataset.tool;
                if (toolName && this.canvasManager.drawingTools) {
                    this.canvasManager.drawingTools.setTool(toolName);
                }
            });
        });
    }

    /**
     * Setup color picker
     */
    setupColorPicker() {
        const colorPicker = document.getElementById('color-picker');
        const colorPresets = document.querySelectorAll('.color-preset');
        
        if (colorPicker) {
            colorPicker.addEventListener('change', (e) => {
                const color = e.target.value;
                this.setColor(color);
            });
        }
        
        colorPresets.forEach(preset => {
            preset.addEventListener('click', (e) => {
                const color = e.currentTarget.dataset.color;
                this.setColor(color);
                
                // Update active state
                colorPresets.forEach(p => p.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                // Update color picker
                if (colorPicker) {
                    colorPicker.value = color;
                }
            });
        });
        
        // Set default color
        this.setColor('#000000');
        colorPresets[0].classList.add('active');
    }

    /**
     * Setup sliders
     */
    setupSliders() {
        const brushSizeSlider = document.getElementById('brush-size');
        const brushSizeValue = document.getElementById('brush-size-value');
        const opacitySlider = document.getElementById('opacity');
        const opacityValue = document.getElementById('opacity-value');
        
        if (brushSizeSlider && brushSizeValue) {
            brushSizeSlider.addEventListener('input', (e) => {
                const size = parseInt(e.target.value);
                brushSizeValue.textContent = size + 'px';
                this.setBrushSize(size);
            });
        }
        
        if (opacitySlider && opacityValue) {
            opacitySlider.addEventListener('input', (e) => {
                const opacity = parseInt(e.target.value) / 100;
                opacityValue.textContent = Math.round(opacity * 100) + '%';
                this.setOpacity(opacity);
            });
        }
    }

    /**
     * Setup line styles
     */
    setupLineStyles() {
        const lineStyleButtons = document.querySelectorAll('.line-style-btn');
        
        lineStyleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const style = e.currentTarget.dataset.style;
                this.setLineStyle(style);
                
                // Update active state
                lineStyleButtons.forEach(btn => btn.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
    }

    /**
     * Setup fill options
     */
    setupFillOptions() {
        const fillButtons = document.querySelectorAll('.fill-btn');
        
        fillButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const fillStyle = e.currentTarget.dataset.fill;
                this.setFillStyle(fillStyle);
                
                // Update active state
                fillButtons.forEach(btn => btn.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
    }

    /**
     * Setup theme toggle
     */
    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    /**
     * Setup fullscreen functionality
     */
    setupFullscreen() {
        const fullscreenBtn = document.getElementById('fullscreen');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }
    }

    /**
     * Setup theme
     */
    setupTheme() {
        // Load saved theme
        const savedTheme = Utils.Storage.load('whiteboard_theme', 'light');
        this.setTheme(savedTheme);
    }

    /**
     * Setup settings
     */
    setupSettings() {
        // Load saved settings
        const savedSettings = Utils.Storage.load('whiteboard_settings', {});
        
        if (savedSettings.color) {
            this.setColor(savedSettings.color);
        }
        
        if (savedSettings.brushSize) {
            this.setBrushSize(savedSettings.brushSize);
        }
        
        if (savedSettings.opacity) {
            this.setOpacity(savedSettings.opacity);
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        // Additional keyboard shortcuts can be added here
        document.addEventListener('keydown', (e) => {
            // Prevent default behavior for certain keys
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        this.fileOperations.newFile();
                        break;
                    case 'o':
                        e.preventDefault();
                        this.fileOperations.openFile();
                        break;
                    case 's':
                        e.preventDefault();
                        this.fileOperations.saveFile();
                        break;
                }
            }
        });
    }

    /**
     * Check for auto-save
     */
    checkAutoSave() {
        if (this.fileOperations) {
            this.fileOperations.loadAutoSave();
        }
    }

    /**
     * Set color
     */
    setColor(color) {
        if (this.canvasManager && this.canvasManager.drawingTools) {
            this.canvasManager.drawingTools.settings.color = color;
            this.saveSettings();
        }
    }

    /**
     * Set brush size
     */
    setBrushSize(size) {
        if (this.canvasManager && this.canvasManager.drawingTools) {
            this.canvasManager.drawingTools.settings.brushSize = size;
            this.saveSettings();
        }
    }

    /**
     * Set opacity
     */
    setOpacity(opacity) {
        if (this.canvasManager && this.canvasManager.drawingTools) {
            this.canvasManager.drawingTools.settings.opacity = opacity;
            this.saveSettings();
        }
    }

    /**
     * Set line style
     */
    setLineStyle(style) {
        if (this.canvasManager && this.canvasManager.drawingTools) {
            this.canvasManager.drawingTools.settings.lineStyle = style;
            this.saveSettings();
        }
    }

    /**
     * Set fill style
     */
    setFillStyle(fillStyle) {
        if (this.canvasManager && this.canvasManager.drawingTools) {
            this.canvasManager.drawingTools.settings.fillStyle = fillStyle;
            this.saveSettings();
        }
    }

    /**
     * Set theme
     */
    setTheme(theme) {
        this.currentTheme = theme;
        document.body.className = theme + '-theme';
        Utils.Storage.save('whiteboard_theme', theme);
        
        // Update theme toggle button
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    /**
     * Toggle fullscreen
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn('Failed to enter fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    /**
     * Save settings
     */
    saveSettings() {
        if (this.canvasManager && this.canvasManager.drawingTools) {
            const settings = {
                color: this.canvasManager.drawingTools.settings.color,
                brushSize: this.canvasManager.drawingTools.settings.brushSize,
                opacity: this.canvasManager.drawingTools.settings.opacity,
                lineStyle: this.canvasManager.drawingTools.settings.lineStyle,
                fillStyle: this.canvasManager.drawingTools.settings.fillStyle
            };
            Utils.Storage.save('whiteboard_settings', settings);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        // Create error notification
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 1rem;
            border-radius: 4px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        // Create success notification
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 1rem;
            border-radius: 4px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    /**
     * Get application statistics
     */
    getStats() {
        const stats = {
            canvas: this.canvasManager ? this.canvasManager.getStats() : null,
            history: historyManager ? historyManager.getStats() : null,
            file: this.fileOperations ? this.fileOperations.getFileStats() : null,
            theme: this.currentTheme,
            timestamp: new Date().toISOString()
        };
        
        return stats;
    }

    /**
     * Export application data
     */
    exportAppData() {
        const data = {
            stats: this.getStats(),
            settings: Utils.Storage.load('whiteboard_settings', {}),
            theme: this.currentTheme,
            history: historyManager ? historyManager.exportHistory() : null
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'whiteboard-app-data.json';
        link.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * Reset application
     */
    reset() {
        const confirmed = confirm('Are you sure you want to reset the application? This will clear all data and settings.');
        if (!confirmed) return;
        
        // Clear all data
        Utils.Storage.clear();
        
        // Reset canvas
        if (this.canvasManager) {
            this.canvasManager.reset();
        }
        
        // Clear history
        if (historyManager) {
            historyManager.clear();
        }
        
        // Reset settings
        this.setupSettings();
        
        // Reset theme
        this.setTheme('light');
        
        this.showSuccess('Application reset successfully');
    }

    /**
     * Cleanup application
     */
    cleanup() {
        // Disable auto-save
        if (this.fileOperations) {
            this.fileOperations.disableAutoSave();
        }
        
        // Clear intervals
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
    }
}

// Global app instance
let whiteboardApp;

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    whiteboardApp = new WhiteboardApp();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (whiteboardApp) {
        whiteboardApp.cleanup();
    }
});

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, save current state
        if (whiteboardApp && whiteboardApp.fileOperations) {
            whiteboardApp.fileOperations.autoSave();
        }
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WhiteboardApp;
}
