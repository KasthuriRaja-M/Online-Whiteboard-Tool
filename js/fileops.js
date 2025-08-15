/**
 * File operations for the Online Whiteboard Tool
 */

class FileOperations {
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
        this.canvas = canvasManager.canvas;
        this.ctx = canvasManager.ctx;
        
        this.setupFileInputs();
        this.setupEventListeners();
    }

    /**
     * Setup file input elements
     */
    setupFileInputs() {
        this.fileInput = document.getElementById('file-input');
        this.openFileInput = document.getElementById('open-file-input');
        
        // Setup open file input
        if (this.openFileInput) {
            this.openFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.loadFile(file);
                }
            });
        }
    }

    /**
     * Setup event listeners for file operations
     */
    setupEventListeners() {
        // New file button
        const newFileBtn = document.getElementById('new-file');
        if (newFileBtn) {
            newFileBtn.addEventListener('click', () => this.newFile());
        }

        // Open file button
        const openFileBtn = document.getElementById('open-file');
        if (openFileBtn) {
            openFileBtn.addEventListener('click', () => this.openFile());
        }

        // Save file button
        const saveFileBtn = document.getElementById('save-file');
        if (saveFileBtn) {
            saveFileBtn.addEventListener('click', () => this.saveFile());
        }

        // Export dropdown items
        const exportItems = document.querySelectorAll('.dropdown-item[data-format]');
        exportItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const format = e.target.dataset.format;
                this.exportFile(format);
            });
        });

        // Clear canvas button
        const clearCanvasBtn = document.getElementById('clear-canvas');
        if (clearCanvasBtn) {
            clearCanvasBtn.addEventListener('click', () => this.clearCanvas());
        }

        // Undo/Redo buttons
        const undoBtn = document.getElementById('undo');
        const redoBtn = document.getElementById('redo');
        
        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undo());
        }
        
        if (redoBtn) {
            redoBtn.addEventListener('click', () => this.redo());
        }
    }

    /**
     * Create a new file
     */
    newFile() {
        if (this.hasUnsavedChanges()) {
            const confirmed = confirm('You have unsaved changes. Are you sure you want to create a new file?');
            if (!confirmed) return;
        }
        
        this.canvasManager.reset();
        this.updateFileName('Untitled');
    }

    /**
     * Open file dialog
     */
    openFile() {
        if (this.openFileInput) {
            this.openFileInput.click();
        }
    }

    /**
     * Load file from input
     */
    loadFile(file) {
        const fileExtension = Utils.getFileExtension(file.name).toLowerCase();
        
        switch (fileExtension) {
            case 'png':
            case 'jpg':
            case 'jpeg':
                this.loadImageFile(file);
                break;
            case 'json':
                this.loadProjectFile(file);
                break;
            default:
                alert('Unsupported file format. Please use PNG, JPG, or JSON files.');
        }
    }

    /**
     * Load image file
     */
    loadImageFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.drawImageOnCanvas(img);
                this.updateFileName(file.name);
            };
            img.onerror = () => {
                alert('Failed to load image file.');
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
            alert('Failed to read file.');
        };
        reader.readAsDataURL(file);
    }

    /**
     * Load project file (JSON)
     */
    loadProjectFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const projectData = JSON.parse(e.target.result);
                this.loadProjectData(projectData);
                this.updateFileName(file.name);
            } catch (error) {
                alert('Failed to parse project file.');
                console.error('Project file parse error:', error);
            }
        };
        reader.onerror = () => {
            alert('Failed to read project file.');
        };
        reader.readAsText(file);
    }

    /**
     * Draw image on canvas
     */
    drawImageOnCanvas(img) {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Calculate image dimensions to fit canvas
        const canvasRatio = this.canvas.width / this.canvas.height;
        const imageRatio = img.width / img.height;
        
        let drawWidth, drawHeight;
        
        if (imageRatio > canvasRatio) {
            drawWidth = this.canvas.width;
            drawHeight = this.canvas.width / imageRatio;
        } else {
            drawHeight = this.canvas.height;
            drawWidth = this.canvas.height * imageRatio;
        }
        
        const x = (this.canvas.width - drawWidth) / 2;
        const y = (this.canvas.height - drawHeight) / 2;
        
        this.ctx.drawImage(img, x, y, drawWidth, drawHeight);
        
        // Add to history
        if (historyManager && !historyManager.isUndoRedoInProgress()) {
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            historyManager.addState({ imageData }, 'Load Image');
        }
    }

    /**
     * Load project data
     */
    loadProjectData(projectData) {
        if (projectData.version && projectData.canvasData) {
            // Load canvas data
            if (projectData.canvasData.imageData) {
                const imageData = new ImageData(
                    new Uint8ClampedArray(projectData.canvasData.imageData),
                    projectData.canvasData.width,
                    projectData.canvasData.height
                );
                
                // Resize canvas if needed
                if (this.canvas.width !== imageData.width || this.canvas.height !== imageData.height) {
                    this.canvas.width = imageData.width;
                    this.canvas.height = imageData.height;
                    this.canvasManager.updateCanvasSizeDisplay();
                }
                
                this.ctx.putImageData(imageData, 0, 0);
            }
            
            // Load settings if available
            if (projectData.settings) {
                this.loadSettings(projectData.settings);
            }
            
            // Add to history
            if (historyManager && !historyManager.isUndoRedoInProgress()) {
                const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                historyManager.addState({ imageData }, 'Load Project');
            }
        } else {
            alert('Invalid project file format.');
        }
    }

    /**
     * Load settings from project data
     */
    loadSettings(settings) {
        // Load tool settings
        if (settings.tools && this.canvasManager.drawingTools) {
            Object.assign(this.canvasManager.drawingTools.settings, settings.tools);
            this.updateSettingsUI();
        }
    }

    /**
     * Update settings UI
     */
    updateSettingsUI() {
        if (!this.canvasManager.drawingTools) return;
        
        const settings = this.canvasManager.drawingTools.settings;
        
        // Update color picker
        const colorPicker = document.getElementById('color-picker');
        if (colorPicker) {
            colorPicker.value = settings.color;
        }
        
        // Update brush size
        const brushSizeSlider = document.getElementById('brush-size');
        const brushSizeValue = document.getElementById('brush-size-value');
        if (brushSizeSlider && brushSizeValue) {
            brushSizeSlider.value = settings.brushSize;
            brushSizeValue.textContent = settings.brushSize + 'px';
        }
        
        // Update opacity
        const opacitySlider = document.getElementById('opacity');
        const opacityValue = document.getElementById('opacity-value');
        if (opacitySlider && opacityValue) {
            opacitySlider.value = settings.opacity * 100;
            opacityValue.textContent = Math.round(settings.opacity * 100) + '%';
        }
    }

    /**
     * Save file
     */
    saveFile() {
        const projectData = this.createProjectData();
        const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = this.getCurrentFileName() + '.json';
        link.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * Export file in specified format
     */
    exportFile(format) {
        switch (format) {
            case 'png':
                this.exportAsPNG();
                break;
            case 'jpeg':
                this.exportAsJPEG();
                break;
            case 'svg':
                this.exportAsSVG();
                break;
            default:
                alert('Unsupported export format.');
        }
    }

    /**
     * Export as PNG
     */
    exportAsPNG() {
        const link = document.createElement('a');
        link.href = this.canvas.toDataURL('image/png');
        link.download = this.getCurrentFileName() + '.png';
        link.click();
    }

    /**
     * Export as JPEG
     */
    exportAsJPEG() {
        const link = document.createElement('a');
        link.href = this.canvas.toDataURL('image/jpeg', 0.9);
        link.download = this.getCurrentFileName() + '.jpg';
        link.click();
    }

    /**
     * Export as SVG
     */
    exportAsSVG() {
        this.canvasManager.exportAsSVG();
    }

    /**
     * Create project data for saving
     */
    createProjectData() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        return {
            version: '1.0',
            name: this.getCurrentFileName(),
            timestamp: Date.now(),
            canvasData: {
                width: this.canvas.width,
                height: this.canvas.height,
                imageData: Array.from(imageData.data)
            },
            settings: this.getCurrentSettings(),
            metadata: {
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                tool: 'Online Whiteboard Tool'
            }
        };
    }

    /**
     * Get current settings
     */
    getCurrentSettings() {
        if (!this.canvasManager.drawingTools) return {};
        
        return {
            tools: { ...this.canvasManager.drawingTools.settings },
            canvas: {
                zoom: this.canvasManager.zoom,
                panX: this.canvasManager.panX,
                panY: this.canvasManager.panY
            }
        };
    }

    /**
     * Clear canvas
     */
    clearCanvas() {
        const confirmed = confirm('Are you sure you want to clear the canvas? This action cannot be undone.');
        if (!confirmed) return;
        
        this.canvasManager.clearCanvas();
        
        // Add to history
        if (historyManager && !historyManager.isUndoRedoInProgress()) {
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            historyManager.addState({ imageData }, 'Clear Canvas');
        }
    }

    /**
     * Undo last action
     */
    undo() {
        this.canvasManager.undo();
    }

    /**
     * Redo last undone action
     */
    redo() {
        this.canvasManager.redo();
    }

    /**
     * Check if there are unsaved changes
     */
    hasUnsavedChanges() {
        // Simple check - if there's any non-white pixels
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            // Check if pixel is not white (255, 255, 255)
            if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Get current file name
     */
    getCurrentFileName() {
        // This could be enhanced to track the actual file name
        return 'whiteboard';
    }

    /**
     * Update file name display
     */
    updateFileName(name) {
        // This could be used to update the UI with the current file name
        console.log('Current file:', name);
    }

    /**
     * Auto-save functionality
     */
    enableAutoSave(interval = 30000) { // 30 seconds
        this.autoSaveInterval = setInterval(() => {
            if (this.hasUnsavedChanges()) {
                this.autoSave();
            }
        }, interval);
    }

    /**
     * Disable auto-save
     */
    disableAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    /**
     * Auto-save to localStorage
     */
    autoSave() {
        try {
            const projectData = this.createProjectData();
            Utils.Storage.save('whiteboard_autosave', projectData);
            console.log('Auto-saved at', new Date().toLocaleTimeString());
        } catch (error) {
            console.warn('Auto-save failed:', error);
        }
    }

    /**
     * Load auto-saved file
     */
    loadAutoSave() {
        try {
            const autoSaveData = Utils.Storage.load('whiteboard_autosave');
            if (autoSaveData) {
                const confirmed = confirm('An auto-saved file was found. Would you like to restore it?');
                if (confirmed) {
                    this.loadProjectData(autoSaveData);
                    return true;
                }
            }
        } catch (error) {
            console.warn('Failed to load auto-save:', error);
        }
        return false;
    }

    /**
     * Clear auto-save
     */
    clearAutoSave() {
        Utils.Storage.remove('whiteboard_autosave');
    }

    /**
     * Get file statistics
     */
    getFileStats() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        let nonWhitePixels = 0;
        let totalPixels = data.length / 4;
        
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
                nonWhitePixels++;
            }
        }
        
        return {
            totalPixels,
            nonWhitePixels,
            coverage: (nonWhitePixels / totalPixels * 100).toFixed(2) + '%',
            fileSize: Utils.formatFileSize(this.canvas.width * this.canvas.height * 4),
            dimensions: `${this.canvas.width} × ${this.canvas.height}`
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileOperations;
}
