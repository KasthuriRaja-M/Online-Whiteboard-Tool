/**
 * Canvas management for the Online Whiteboard Tool
 */

class CanvasManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.drawingTools = null;
        
        // Canvas state
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.lastPanPoint = null;
        
        // Canvas dimensions
        this.originalWidth = this.canvas.width;
        this.originalHeight = this.canvas.height;
        
        // Drawing state
        this.isDrawing = false;
        this.lastPoint = null;
        
        // Initialize canvas
        this.initializeCanvas();
        this.setupEventListeners();
        this.setupZoomControls();
    }

    /**
     * Initialize canvas with default settings
     */
    initializeCanvas() {
        // Set canvas size
        this.resizeCanvas();
        
        // Set default canvas properties
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Clear canvas with white background
        this.clearCanvas();
        
        // Initialize drawing tools
        this.drawingTools = new DrawingTools(this.canvas, this.ctx);
    }

    /**
     * Resize canvas to fit container
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        
        // Set canvas size to container size
        this.canvas.width = containerRect.width;
        this.canvas.height = containerRect.height;
        
        // Update canvas size display
        this.updateCanvasSizeDisplay();
    }

    /**
     * Update canvas size display
     */
    updateCanvasSizeDisplay() {
        const sizeElement = document.getElementById('canvas-size');
        if (sizeElement) {
            sizeElement.textContent = `${this.canvas.width} × ${this.canvas.height}`;
        }
    }

    /**
     * Setup event listeners for canvas interactions
     */
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Window resize
        window.addEventListener('resize', Utils.debounce(this.handleResize.bind(this), 250));
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * Setup zoom controls
     */
    setupZoomControls() {
        const zoomInBtn = document.getElementById('zoom-in');
        const zoomOutBtn = document.getElementById('zoom-out');
        const zoomFitBtn = document.getElementById('zoom-fit');
        const zoomLevelElement = document.getElementById('zoom-level');

        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => this.zoomIn());
        }

        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => this.zoomOut());
        }

        if (zoomFitBtn) {
            zoomFitBtn.addEventListener('click', () => this.zoomFit());
        }

        // Update zoom level display
        this.updateZoomDisplay();
    }

    /**
     * Handle mouse down events
     */
    handleMouseDown(e) {
        e.preventDefault();
        
        const point = this.getEventPoint(e);
        
        // Check if middle mouse button (panning)
        if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
            this.startPanning(point);
            return;
        }
        
        // Handle drawing tools
        if (this.drawingTools) {
            this.drawingTools.handleMouseDown(e);
        }
    }

    /**
     * Handle mouse move events
     */
    handleMouseMove(e) {
        e.preventDefault();
        
        const point = this.getEventPoint(e);
        
        // Handle panning
        if (this.isPanning) {
            this.updatePanning(point);
            return;
        }
        
        // Handle drawing tools
        if (this.drawingTools) {
            this.drawingTools.handleMouseMove(e);
        }
    }

    /**
     * Handle mouse up events
     */
    handleMouseUp(e) {
        e.preventDefault();
        
        // Stop panning
        if (this.isPanning) {
            this.stopPanning();
            return;
        }
        
        // Handle drawing tools
        if (this.drawingTools) {
            this.drawingTools.handleMouseUp(e);
        }
    }

    /**
     * Handle mouse leave events
     */
    handleMouseLeave(e) {
        // Stop any ongoing operations
        this.isPanning = false;
        if (this.drawingTools) {
            this.drawingTools.handleMouseUp(e);
        }
    }

    /**
     * Handle touch start events
     */
    handleTouchStart(e) {
        e.preventDefault();
        
        if (e.touches.length === 1) {
            // Single touch - drawing
            this.handleMouseDown(e);
        } else if (e.touches.length === 2) {
            // Two finger touch - zoom/pan
            this.startPinchZoom(e);
        }
    }

    /**
     * Handle touch move events
     */
    handleTouchMove(e) {
        e.preventDefault();
        
        if (e.touches.length === 1) {
            // Single touch - drawing
            this.handleMouseMove(e);
        } else if (e.touches.length === 2) {
            // Two finger touch - zoom/pan
            this.updatePinchZoom(e);
        }
    }

    /**
     * Handle touch end events
     */
    handleTouchEnd(e) {
        e.preventDefault();
        
        if (e.touches.length === 0) {
            // No touches left
            this.handleMouseUp(e);
            this.stopPinchZoom();
        }
    }

    /**
     * Handle keyboard events
     */
    handleKeyDown(e) {
        // Tool shortcuts
        const toolShortcuts = {
            'KeyB': 'brush',
            'KeyE': 'eraser',
            'KeyR': 'rectangle',
            'KeyC': 'circle',
            'KeyL': 'line',
            'KeyT': 'text',
            'KeyS': 'selection'
        };

        if (toolShortcuts[e.code] && this.drawingTools) {
            e.preventDefault();
            this.drawingTools.setTool(toolShortcuts[e.code]);
        }

        // Zoom shortcuts
        if (e.key === '+' || e.key === '=') {
            e.preventDefault();
            this.zoomIn();
        } else if (e.key === '-') {
            e.preventDefault();
            this.zoomOut();
        }

        // Undo/Redo shortcuts
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
                e.preventDefault();
                this.redo();
            } else if (e.key === 's') {
                e.preventDefault();
                this.saveCanvas();
            } else if (e.key === 'o') {
                e.preventDefault();
                this.openFile();
            }
        }

        // Delete key
        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            this.deleteSelected();
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        this.resizeCanvas();
        this.redrawCanvas();
    }

    /**
     * Get event point with zoom and pan transformation
     */
    getEventPoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
        
        // Convert to canvas coordinates
        const canvasX = (clientX - rect.left) / this.zoom - this.panX;
        const canvasY = (clientY - rect.top) / this.zoom - this.panY;
        
        return { x: canvasX, y: canvasY };
    }

    /**
     * Start panning
     */
    startPanning(point) {
        this.isPanning = true;
        this.lastPanPoint = point;
        this.canvas.style.cursor = 'grabbing';
    }

    /**
     * Update panning
     */
    updatePanning(point) {
        if (!this.isPanning || !this.lastPanPoint) return;
        
        const deltaX = point.x - this.lastPanPoint.x;
        const deltaY = point.y - this.lastPanPoint.y;
        
        this.panX += deltaX;
        this.panY += deltaY;
        
        this.lastPanPoint = point;
        this.redrawCanvas();
    }

    /**
     * Stop panning
     */
    stopPanning() {
        this.isPanning = false;
        this.lastPanPoint = null;
        this.canvas.style.cursor = '';
    }

    /**
     * Start pinch zoom
     */
    startPinchZoom(e) {
        if (e.touches.length !== 2) return;
        
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        this.initialPinchDistance = Utils.distance(
            touch1.clientX, touch1.clientY,
            touch2.clientX, touch2.clientY
        );
        
        this.initialZoom = this.zoom;
    }

    /**
     * Update pinch zoom
     */
    updatePinchZoom(e) {
        if (e.touches.length !== 2 || !this.initialPinchDistance) return;
        
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        const currentDistance = Utils.distance(
            touch1.clientX, touch1.clientY,
            touch2.clientX, touch2.clientY
        );
        
        const scale = currentDistance / this.initialPinchDistance;
        const newZoom = this.initialZoom * scale;
        
        this.setZoom(newZoom);
    }

    /**
     * Stop pinch zoom
     */
    stopPinchZoom() {
        this.initialPinchDistance = null;
        this.initialZoom = null;
    }

    /**
     * Zoom in
     */
    zoomIn() {
        this.setZoom(this.zoom * 1.2);
    }

    /**
     * Zoom out
     */
    zoomOut() {
        this.setZoom(this.zoom / 1.2);
    }

    /**
     * Zoom to fit canvas
     */
    zoomFit() {
        const container = this.canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        
        const scaleX = containerRect.width / this.originalWidth;
        const scaleY = containerRect.height / this.originalHeight;
        const scale = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 100%
        
        this.setZoom(scale);
        this.centerCanvas();
    }

    /**
     * Set zoom level
     */
    setZoom(newZoom) {
        const minZoom = 0.1;
        const maxZoom = 5.0;
        
        this.zoom = Utils.clamp(newZoom, minZoom, maxZoom);
        this.updateZoomDisplay();
        this.redrawCanvas();
    }

    /**
     * Center canvas
     */
    centerCanvas() {
        const container = this.canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        
        const scaledWidth = this.originalWidth * this.zoom;
        const scaledHeight = this.originalHeight * this.zoom;
        
        this.panX = (containerRect.width - scaledWidth) / 2;
        this.panY = (containerRect.height - scaledHeight) / 2;
    }

    /**
     * Update zoom display
     */
    updateZoomDisplay() {
        const zoomLevelElement = document.getElementById('zoom-level');
        if (zoomLevelElement) {
            zoomLevelElement.textContent = `${Math.round(this.zoom * 100)}%`;
        }
    }

    /**
     * Clear canvas
     */
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fill with white background
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Redraw canvas with current zoom and pan
     */
    redrawCanvas() {
        // Save current context state
        this.ctx.save();
        
        // Apply transformations
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.zoom, this.zoom);
        
        // Clear and redraw
        this.clearCanvas();
        
        // Restore context state
        this.ctx.restore();
    }

    /**
     * Save canvas state to history
     */
    saveToHistory(description = '') {
        if (historyManager && !historyManager.isUndoRedoInProgress()) {
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            historyManager.addState({ imageData }, description);
        }
    }

    /**
     * Load canvas state from history
     */
    loadFromHistory(state) {
        if (state && state.imageData) {
            this.ctx.putImageData(state.imageData, 0, 0);
        }
    }

    /**
     * Undo last action
     */
    undo() {
        if (historyManager) {
            const previousState = historyManager.undo();
            if (previousState) {
                this.loadFromHistory(previousState);
            }
        }
    }

    /**
     * Redo last undone action
     */
    redo() {
        if (historyManager) {
            const nextState = historyManager.redo();
            if (nextState) {
                this.loadFromHistory(nextState);
            }
        }
    }

    /**
     * Save canvas as image
     */
    saveCanvas(format = 'png') {
        const link = document.createElement('a');
        link.download = `whiteboard.${format}`;
        
        if (format === 'png') {
            link.href = this.canvas.toDataURL('image/png');
        } else if (format === 'jpeg') {
            link.href = this.canvas.toDataURL('image/jpeg', 0.9);
        }
        
        link.click();
    }

    /**
     * Open file
     */
    openFile() {
        const input = document.getElementById('open-file-input');
        if (input) {
            input.click();
        }
    }

    /**
     * Delete selected objects
     */
    deleteSelected() {
        // Implementation for deleting selected objects
        console.log('Delete selected objects');
    }

    /**
     * Get canvas data URL
     */
    getDataURL(format = 'png') {
        if (format === 'png') {
            return this.canvas.toDataURL('image/png');
        } else if (format === 'jpeg') {
            return this.canvas.toDataURL('image/jpeg', 0.9);
        }
        return this.canvas.toDataURL();
    }

    /**
     * Get canvas as blob
     */
    getBlob(format = 'png') {
        return new Promise((resolve) => {
            this.canvas.toBlob((blob) => {
                resolve(blob);
            }, `image/${format}`);
        });
    }

    /**
     * Export canvas as SVG (basic implementation)
     */
    exportAsSVG() {
        const svg = `
            <svg width="${this.canvas.width}" height="${this.canvas.height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="white"/>
                <image href="${this.getDataURL()}" width="100%" height="100%"/>
            </svg>
        `;
        
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'whiteboard.svg';
        link.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * Get canvas statistics
     */
    getStats() {
        return {
            width: this.canvas.width,
            height: this.canvas.height,
            zoom: this.zoom,
            panX: this.panX,
            panY: this.panY,
            memoryUsage: this.estimateMemoryUsage()
        };
    }

    /**
     * Estimate memory usage
     */
    estimateMemoryUsage() {
        // Rough estimation: 4 bytes per pixel (RGBA)
        return this.canvas.width * this.canvas.height * 4;
    }

    /**
     * Reset canvas
     */
    reset() {
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.clearCanvas();
        this.updateZoomDisplay();
        
        if (historyManager) {
            historyManager.clear();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CanvasManager;
}
