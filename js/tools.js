/**
 * Drawing tools implementation for the Online Whiteboard Tool
 */

class DrawingTools {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.currentTool = 'brush';
        this.isDrawing = false;
        this.lastPoint = null;
        this.selectedObjects = [];
        this.tempCanvas = document.createElement('canvas');
        this.tempCtx = this.tempCanvas.getContext('2d');
        
        // Tool settings
        this.settings = {
            color: '#000000',
            brushSize: 5,
            opacity: 1.0,
            lineStyle: 'solid',
            fillStyle: 'none',
            fontFamily: 'Arial',
            fontSize: 16
        };
        
        this.initializeTools();
    }

    /**
     * Initialize all drawing tools
     */
    initializeTools() {
        this.tools = {
            brush: new BrushTool(this),
            eraser: new EraserTool(this),
            rectangle: new RectangleTool(this),
            circle: new CircleTool(this),
            line: new LineTool(this),
            arrow: new ArrowTool(this),
            triangle: new TriangleTool(this),
            text: new TextTool(this),
            selection: new SelectionTool(this),
            image: new ImageTool(this)
        };
    }

    /**
     * Set the current drawing tool
     * @param {string} toolName - Name of the tool to set
     */
    setTool(toolName) {
        if (this.tools[toolName]) {
            this.currentTool = toolName;
            this.updateToolUI();
        }
    }

    /**
     * Get the current tool instance
     * @returns {Object} Current tool instance
     */
    getCurrentTool() {
        return this.tools[this.currentTool];
    }

    /**
     * Update tool UI (active states, etc.)
     */
    updateToolUI() {
        // Remove active class from all tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to current tool button
        const currentToolBtn = document.querySelector(`[data-tool="${this.currentTool}"]`);
        if (currentToolBtn) {
            currentToolBtn.classList.add('active');
        }

        // Update cursor
        this.updateCursor();
    }

    /**
     * Update cursor based on current tool
     */
    updateCursor() {
        const cursorMap = {
            brush: 'crosshair',
            eraser: 'crosshair',
            rectangle: 'crosshair',
            circle: 'crosshair',
            line: 'crosshair',
            arrow: 'crosshair',
            triangle: 'crosshair',
            text: 'text',
            selection: 'default',
            image: 'crosshair'
        };

        this.canvas.style.cursor = cursorMap[this.currentTool] || 'crosshair';
    }

    /**
     * Handle mouse/touch events
     */
    handleMouseDown(e) {
        const point = this.getEventPoint(e);
        this.isDrawing = true;
        this.lastPoint = point;
        
        const tool = this.getCurrentTool();
        if (tool && tool.onMouseDown) {
            tool.onMouseDown(point, e);
        }
    }

    handleMouseMove(e) {
        const point = this.getEventPoint(e);
        
        if (this.isDrawing) {
            const tool = this.getCurrentTool();
            if (tool && tool.onMouseMove) {
                tool.onMouseMove(point, e);
            }
        }
        
        // Update coordinates display
        this.updateCoordinates(point);
    }

    handleMouseUp(e) {
        const point = this.getEventPoint(e);
        this.isDrawing = false;
        
        const tool = this.getCurrentTool();
        if (tool && tool.onMouseUp) {
            tool.onMouseUp(point, e);
        }
        
        this.lastPoint = null;
    }

    /**
     * Get point from mouse/touch event
     * @param {Event} e - Mouse or touch event
     * @returns {Object} Point coordinates {x, y}
     */
    getEventPoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
        
        return Utils.screenToCanvas(clientX, clientY, this.canvas);
    }

    /**
     * Update coordinates display
     * @param {Object} point - Point coordinates
     */
    updateCoordinates(point) {
        const coordsElement = document.getElementById('coordinates');
        if (coordsElement) {
            coordsElement.textContent = `X: ${Math.round(point.x)}, Y: ${Math.round(point.y)}`;
        }
    }

    /**
     * Apply current settings to context
     */
    applySettings() {
        this.ctx.strokeStyle = this.settings.color;
        this.ctx.fillStyle = this.settings.color;
        this.ctx.lineWidth = this.settings.brushSize;
        this.ctx.globalAlpha = this.settings.opacity;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Apply line style
        switch (this.settings.lineStyle) {
            case 'dashed':
                this.ctx.setLineDash([this.settings.brushSize * 2, this.settings.brushSize]);
                break;
            case 'dotted':
                this.ctx.setLineDash([this.settings.brushSize, this.settings.brushSize]);
                break;
            default:
                this.ctx.setLineDash([]);
        }
    }
}

/**
 * Base tool class
 */
class BaseTool {
    constructor(tools) {
        this.tools = tools;
        this.canvas = tools.canvas;
        this.ctx = tools.ctx;
        this.settings = tools.settings;
    }

    applySettings() {
        this.tools.applySettings();
    }
}

/**
 * Brush tool for freehand drawing
 */
class BrushTool extends BaseTool {
    constructor(tools) {
        super(tools);
        this.points = [];
    }

    onMouseDown(point, e) {
        this.points = [point];
        this.applySettings();
        this.ctx.beginPath();
        this.ctx.moveTo(point.x, point.y);
    }

    onMouseMove(point, e) {
        this.points.push(point);
        
        // Draw smooth curve through points
        if (this.points.length >= 3) {
            const lastTwoPoints = this.points.slice(-2);
            const cp1x = lastTwoPoints[0].x;
            const cp1y = lastTwoPoints[0].y;
            const cp2x = point.x;
            const cp2y = point.y;
            
            this.ctx.quadraticCurveTo(cp1x, cp1y, cp2x, cp2y);
        } else {
            this.ctx.lineTo(point.x, point.y);
        }
        
        this.ctx.stroke();
    }

    onMouseUp(point, e) {
        if (this.points.length > 1) {
            // Add to history
            if (historyManager && !historyManager.isUndoRedoInProgress()) {
                const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                historyManager.addState({ imageData }, 'Brush Stroke');
            }
        }
    }
}

/**
 * Eraser tool
 */
class EraserTool extends BaseTool {
    constructor(tools) {
        super(tools);
        this.originalComposite = this.ctx.globalCompositeOperation;
    }

    onMouseDown(point, e) {
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.lineWidth = this.settings.brushSize;
        this.ctx.beginPath();
        this.ctx.moveTo(point.x, point.y);
    }

    onMouseMove(point, e) {
        this.ctx.lineTo(point.x, point.y);
        this.ctx.stroke();
    }

    onMouseUp(point, e) {
        this.ctx.globalCompositeOperation = this.originalComposite;
        
        // Add to history
        if (historyManager && !historyManager.isUndoRedoInProgress()) {
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            historyManager.addState({ imageData }, 'Eraser');
        }
    }
}

/**
 * Rectangle tool
 */
class RectangleTool extends BaseTool {
    constructor(tools) {
        super(tools);
        this.startPoint = null;
    }

    onMouseDown(point, e) {
        this.startPoint = point;
        this.applySettings();
    }

    onMouseMove(point, e) {
        if (!this.startPoint) return;
        
        // Clear canvas and redraw
        this.redrawCanvas();
        
        const width = point.x - this.startPoint.x;
        const height = point.y - this.startPoint.y;
        
        this.ctx.beginPath();
        this.ctx.rect(this.startPoint.x, this.startPoint.y, width, height);
        
        if (this.settings.fillStyle === 'solid') {
            this.ctx.fill();
        }
        this.ctx.stroke();
    }

    onMouseUp(point, e) {
        if (!this.startPoint) return;
        
        const width = point.x - this.startPoint.x;
        const height = point.y - this.startPoint.y;
        
        // Only add to history if rectangle has size
        if (Math.abs(width) > 2 && Math.abs(height) > 2) {
            if (historyManager && !historyManager.isUndoRedoInProgress()) {
                const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                historyManager.addState({ imageData }, 'Rectangle');
            }
        }
        
        this.startPoint = null;
    }

    redrawCanvas() {
        // This would need to be implemented to redraw the canvas
        // For now, we'll just clear and redraw
        // In a real implementation, you'd want to preserve existing content
    }
}

/**
 * Circle tool
 */
class CircleTool extends BaseTool {
    constructor(tools) {
        super(tools);
        this.startPoint = null;
    }

    onMouseDown(point, e) {
        this.startPoint = point;
        this.applySettings();
    }

    onMouseMove(point, e) {
        if (!this.startPoint) return;
        
        this.redrawCanvas();
        
        const radius = Utils.distance(this.startPoint.x, this.startPoint.y, point.x, point.y);
        
        this.ctx.beginPath();
        this.ctx.arc(this.startPoint.x, this.startPoint.y, radius, 0, 2 * Math.PI);
        
        if (this.settings.fillStyle === 'solid') {
            this.ctx.fill();
        }
        this.ctx.stroke();
    }

    onMouseUp(point, e) {
        if (!this.startPoint) return;
        
        const radius = Utils.distance(this.startPoint.x, this.startPoint.y, point.x, point.y);
        
        if (radius > 2) {
            if (historyManager && !historyManager.isUndoRedoInProgress()) {
                const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                historyManager.addState({ imageData }, 'Circle');
            }
        }
        
        this.startPoint = null;
    }

    redrawCanvas() {
        // Implementation needed
    }
}

/**
 * Line tool
 */
class LineTool extends BaseTool {
    constructor(tools) {
        super(tools);
        this.startPoint = null;
    }

    onMouseDown(point, e) {
        this.startPoint = point;
        this.applySettings();
    }

    onMouseMove(point, e) {
        if (!this.startPoint) return;
        
        this.redrawCanvas();
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.startPoint.x, this.startPoint.y);
        this.ctx.lineTo(point.x, point.y);
        this.ctx.stroke();
    }

    onMouseUp(point, e) {
        if (!this.startPoint) return;
        
        const distance = Utils.distance(this.startPoint.x, this.startPoint.y, point.x, point.y);
        
        if (distance > 2) {
            if (historyManager && !historyManager.isUndoRedoInProgress()) {
                const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                historyManager.addState({ imageData }, 'Line');
            }
        }
        
        this.startPoint = null;
    }

    redrawCanvas() {
        // Implementation needed
    }
}

/**
 * Arrow tool
 */
class ArrowTool extends BaseTool {
    constructor(tools) {
        super(tools);
        this.startPoint = null;
    }

    onMouseDown(point, e) {
        this.startPoint = point;
        this.applySettings();
    }

    onMouseMove(point, e) {
        if (!this.startPoint) return;
        
        this.redrawCanvas();
        this.drawArrow(this.startPoint, point);
    }

    onMouseUp(point, e) {
        if (!this.startPoint) return;
        
        const distance = Utils.distance(this.startPoint.x, this.startPoint.y, point.x, point.y);
        
        if (distance > 2) {
            if (historyManager && !historyManager.isUndoRedoInProgress()) {
                const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                historyManager.addState({ imageData }, 'Arrow');
            }
        }
        
        this.startPoint = null;
    }

    drawArrow(from, to) {
        const headLength = 15;
        const angle = Utils.angle(from.x, from.y, to.x, to.y);
        
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.stroke();
        
        // Draw arrow head
        this.ctx.beginPath();
        this.ctx.moveTo(to.x, to.y);
        this.ctx.lineTo(
            to.x - headLength * Math.cos(angle - Math.PI / 6),
            to.y - headLength * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.moveTo(to.x, to.y);
        this.ctx.lineTo(
            to.x - headLength * Math.cos(angle + Math.PI / 6),
            to.y - headLength * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.stroke();
    }

    redrawCanvas() {
        // Implementation needed
    }
}

/**
 * Triangle tool
 */
class TriangleTool extends BaseTool {
    constructor(tools) {
        super(tools);
        this.startPoint = null;
    }

    onMouseDown(point, e) {
        this.startPoint = point;
        this.applySettings();
    }

    onMouseMove(point, e) {
        if (!this.startPoint) return;
        
        this.redrawCanvas();
        this.drawTriangle(this.startPoint, point);
    }

    onMouseUp(point, e) {
        if (!this.startPoint) return;
        
        const distance = Utils.distance(this.startPoint.x, this.startPoint.y, point.x, point.y);
        
        if (distance > 2) {
            if (historyManager && !historyManager.isUndoRedoInProgress()) {
                const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                historyManager.addState({ imageData }, 'Triangle');
            }
        }
        
        this.startPoint = null;
    }

    drawTriangle(from, to) {
        const width = to.x - from.x;
        const height = to.y - from.y;
        
        this.ctx.beginPath();
        this.ctx.moveTo(from.x + width / 2, from.y);
        this.ctx.lineTo(from.x, from.y + height);
        this.ctx.lineTo(from.x + width, from.y + height);
        this.ctx.closePath();
        
        if (this.settings.fillStyle === 'solid') {
            this.ctx.fill();
        }
        this.ctx.stroke();
    }

    redrawCanvas() {
        // Implementation needed
    }
}

/**
 * Text tool
 */
class TextTool extends BaseTool {
    constructor(tools) {
        super(tools);
        this.textModal = document.getElementById('text-modal');
        this.textInput = document.getElementById('text-input');
        this.fontFamilySelect = document.getElementById('font-family');
        this.fontSizeSlider = document.getElementById('font-size');
        this.fontSizeValue = document.getElementById('font-size-value');
        this.textApplyBtn = document.getElementById('text-apply');
        this.textCancelBtn = document.getElementById('text-cancel');
        this.clickPoint = null;
        
        this.initializeTextModal();
    }

    initializeTextModal() {
        // Font size slider
        this.fontSizeSlider.addEventListener('input', (e) => {
            const size = e.target.value;
            this.fontSizeValue.textContent = size + 'px';
            this.settings.fontSize = parseInt(size);
        });

        // Apply text
        this.textApplyBtn.addEventListener('click', () => {
            this.addText();
            this.hideTextModal();
        });

        // Cancel text
        this.textCancelBtn.addEventListener('click', () => {
            this.hideTextModal();
        });

        // Close modal
        this.textModal.querySelector('.modal-close').addEventListener('click', () => {
            this.hideTextModal();
        });
    }

    onMouseDown(point, e) {
        this.clickPoint = point;
        this.showTextModal();
    }

    onMouseMove(point, e) {
        // Text tool doesn't need mouse move
    }

    onMouseUp(point, e) {
        // Text tool doesn't need mouse up
    }

    showTextModal() {
        this.textModal.classList.add('show');
        this.textInput.focus();
        this.textInput.value = '';
    }

    hideTextModal() {
        this.textModal.classList.remove('show');
        this.clickPoint = null;
    }

    addText() {
        if (!this.clickPoint || !this.textInput.value.trim()) return;
        
        const text = this.textInput.value.trim();
        const fontFamily = this.fontFamilySelect.value;
        const fontSize = this.settings.fontSize;
        
        this.applySettings();
        this.ctx.font = `${fontSize}px ${fontFamily}`;
        this.ctx.textBaseline = 'top';
        
        this.ctx.fillText(text, this.clickPoint.x, this.clickPoint.y);
        
        if (historyManager && !historyManager.isUndoRedoInProgress()) {
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            historyManager.addState({ imageData }, 'Text');
        }
    }
}

/**
 * Selection tool
 */
class SelectionTool extends BaseTool {
    constructor(tools) {
        super(tools);
        this.selectionStart = null;
        this.selectionEnd = null;
        this.isSelecting = false;
        this.selectedArea = null;
    }

    onMouseDown(point, e) {
        this.selectionStart = point;
        this.isSelecting = true;
        this.selectedArea = null;
    }

    onMouseMove(point, e) {
        if (!this.isSelecting) return;
        
        this.selectionEnd = point;
        this.drawSelectionBox();
    }

    onMouseUp(point, e) {
        if (!this.isSelecting) return;
        
        this.isSelecting = false;
        this.selectionEnd = point;
        
        if (this.selectionStart && this.selectionEnd) {
            this.selectedArea = {
                x: Math.min(this.selectionStart.x, this.selectionEnd.x),
                y: Math.min(this.selectionStart.y, this.selectionEnd.y),
                width: Math.abs(this.selectionEnd.x - this.selectionStart.x),
                height: Math.abs(this.selectionEnd.y - this.selectionStart.y)
            };
        }
    }

    drawSelectionBox() {
        if (!this.selectionStart || !this.selectionEnd) return;
        
        // Clear any previous selection box
        this.redrawCanvas();
        
        // Draw selection box
        this.ctx.strokeStyle = '#007bff';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        
        const x = Math.min(this.selectionStart.x, this.selectionEnd.x);
        const y = Math.min(this.selectionStart.y, this.selectionEnd.y);
        const width = Math.abs(this.selectionEnd.x - this.selectionStart.x);
        const height = Math.abs(this.selectionEnd.y - this.selectionStart.y);
        
        this.ctx.strokeRect(x, y, width, height);
        this.ctx.setLineDash([]);
    }

    redrawCanvas() {
        // Implementation needed
    }
}

/**
 * Image tool
 */
class ImageTool extends BaseTool {
    constructor(tools) {
        super(tools);
        this.fileInput = document.getElementById('file-input');
        this.initializeFileInput();
    }

    initializeFileInput() {
        this.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadImage(file);
            }
        });
    }

    onMouseDown(point, e) {
        this.fileInput.click();
    }

    onMouseMove(point, e) {
        // Image tool doesn't need mouse move
    }

    onMouseUp(point, e) {
        // Image tool doesn't need mouse up
    }

    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.drawImage(img);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    drawImage(img) {
        // Calculate image dimensions to fit canvas
        const canvasRatio = this.canvas.width / this.canvas.height;
        const imageRatio = img.width / img.height;
        
        let drawWidth, drawHeight;
        
        if (imageRatio > canvasRatio) {
            drawWidth = this.canvas.width * 0.8;
            drawHeight = drawWidth / imageRatio;
        } else {
            drawHeight = this.canvas.height * 0.8;
            drawWidth = drawHeight * imageRatio;
        }
        
        const x = (this.canvas.width - drawWidth) / 2;
        const y = (this.canvas.height - drawHeight) / 2;
        
        this.ctx.drawImage(img, x, y, drawWidth, drawHeight);
        
        if (historyManager && !historyManager.isUndoRedoInProgress()) {
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            historyManager.addState({ imageData }, 'Image');
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DrawingTools, BaseTool };
}
