/**
 * History management for undo/redo functionality
 */

class HistoryManager {
    constructor(maxHistorySize = 50) {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistorySize = maxHistorySize;
        this.isUndoRedoAction = false;
    }

    /**
     * Add a new state to history
     * @param {Object} state - State to save
     * @param {string} description - Description of the action
     */
    addState(state, description = '') {
        // If we're in the middle of history, remove all future states
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        // Add new state
        const historyItem = {
            id: Utils.generateId(),
            state: Utils.deepClone(state),
            description,
            timestamp: Date.now()
        };

        this.history.push(historyItem);
        this.currentIndex++;

        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.currentIndex--;
        }

        this.updateUI();
    }

    /**
     * Undo the last action
     * @returns {Object|null} Previous state or null if no undo available
     */
    undo() {
        if (this.canUndo()) {
            this.isUndoRedoAction = true;
            this.currentIndex--;
            const state = Utils.deepClone(this.history[this.currentIndex].state);
            this.updateUI();
            this.isUndoRedoAction = false;
            return state;
        }
        return null;
    }

    /**
     * Redo the last undone action
     * @returns {Object|null} Next state or null if no redo available
     */
    redo() {
        if (this.canRedo()) {
            this.isUndoRedoAction = true;
            this.currentIndex++;
            const state = Utils.deepClone(this.history[this.currentIndex].state);
            this.updateUI();
            this.isUndoRedoAction = false;
            return state;
        }
        return null;
    }

    /**
     * Check if undo is available
     * @returns {boolean} True if undo is available
     */
    canUndo() {
        return this.currentIndex > 0;
    }

    /**
     * Check if redo is available
     * @returns {boolean} True if redo is available
     */
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    /**
     * Get current state
     * @returns {Object|null} Current state or null if no history
     */
    getCurrentState() {
        if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
            return Utils.deepClone(this.history[this.currentIndex].state);
        }
        return null;
    }

    /**
     * Get history information
     * @returns {Object} History information
     */
    getHistoryInfo() {
        return {
            totalStates: this.history.length,
            currentIndex: this.currentIndex,
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            currentDescription: this.currentIndex >= 0 ? 
                this.history[this.currentIndex].description : ''
        };
    }

    /**
     * Clear all history
     */
    clear() {
        this.history = [];
        this.currentIndex = -1;
        this.updateUI();
    }

    /**
     * Update UI elements (undo/redo buttons)
     */
    updateUI() {
        const undoBtn = document.getElementById('undo');
        const redoBtn = document.getElementById('redo');

        if (undoBtn) {
            undoBtn.disabled = !this.canUndo();
        }

        if (redoBtn) {
            redoBtn.disabled = !this.canRedo();
        }

        // Update status info if available
        this.updateStatusInfo();
    }

    /**
     * Update status information display
     */
    updateStatusInfo() {
        const statusInfo = document.getElementById('tool-info');
        if (statusInfo && this.currentIndex >= 0) {
            const currentItem = this.history[this.currentIndex];
            const actionCount = this.currentIndex + 1;
            const totalActions = this.history.length;
            
            if (currentItem.description) {
                statusInfo.textContent = `${currentItem.description} (${actionCount}/${totalActions})`;
            } else {
                statusInfo.textContent = `Action ${actionCount} of ${totalActions}`;
            }
        }
    }

    /**
     * Get history statistics
     * @returns {Object} History statistics
     */
    getStats() {
        const totalActions = this.history.length;
        const memoryUsage = this.estimateMemoryUsage();
        
        return {
            totalActions,
            currentPosition: this.currentIndex + 1,
            memoryUsage: Utils.formatFileSize(memoryUsage),
            averageStateSize: totalActions > 0 ? 
                Utils.formatFileSize(memoryUsage / totalActions) : '0 Bytes'
        };
    }

    /**
     * Estimate memory usage of history
     * @returns {number} Estimated memory usage in bytes
     */
    estimateMemoryUsage() {
        let totalSize = 0;
        
        for (const item of this.history) {
            // Rough estimation: JSON string length * 2 (for object overhead)
            const stateSize = JSON.stringify(item.state).length * 2;
            const descriptionSize = item.description.length;
            const metadataSize = 100; // ID, timestamp, etc.
            totalSize += stateSize + descriptionSize + metadataSize;
        }
        
        return totalSize;
    }

    /**
     * Export history for debugging
     * @returns {Object} Exported history data
     */
    exportHistory() {
        return {
            history: this.history.map(item => ({
                id: item.id,
                description: item.description,
                timestamp: item.timestamp,
                stateSize: JSON.stringify(item.state).length
            })),
            currentIndex: this.currentIndex,
            maxHistorySize: this.maxHistorySize,
            stats: this.getStats()
        };
    }

    /**
     * Check if an action is currently being undone/redone
     * @returns {boolean} True if undo/redo action is in progress
     */
    isUndoRedoInProgress() {
        return this.isUndoRedoAction;
    }

    /**
     * Batch multiple actions into a single history entry
     * @param {Function} actionCallback - Function that performs the actions
     * @param {string} description - Description for the batched action
     */
    batchActions(actionCallback, description = 'Batch Action') {
        const startIndex = this.currentIndex;
        
        // Perform the actions
        actionCallback();
        
        // If multiple states were added, combine them
        if (this.currentIndex > startIndex + 1) {
            const statesToCombine = this.history.slice(startIndex + 1, this.currentIndex + 1);
            const lastState = statesToCombine[statesToCombine.length - 1];
            
            // Remove intermediate states
            this.history.splice(startIndex + 1, statesToCombine.length - 1);
            this.currentIndex = startIndex + 1;
            
            // Update description
            this.history[this.currentIndex].description = description;
        }
        
        this.updateUI();
    }

    /**
     * Add a checkpoint (important state that should be preserved)
     * @param {Object} state - State to save
     * @param {string} description - Description of the checkpoint
     */
    addCheckpoint(state, description = 'Checkpoint') {
        this.addState(state, `🔖 ${description}`);
    }

    /**
     * Jump to a specific history index
     * @param {number} index - History index to jump to
     * @returns {Object|null} State at the specified index
     */
    jumpToIndex(index) {
        if (index >= 0 && index < this.history.length) {
            this.isUndoRedoAction = true;
            this.currentIndex = index;
            const state = Utils.deepClone(this.history[index].state);
            this.updateUI();
            this.isUndoRedoAction = false;
            return state;
        }
        return null;
    }

    /**
     * Get recent history items for display
     * @param {number} count - Number of recent items to return
     * @returns {Array} Recent history items
     */
    getRecentHistory(count = 10) {
        const startIndex = Math.max(0, this.history.length - count);
        return this.history.slice(startIndex).map((item, index) => ({
            ...item,
            isCurrent: startIndex + index === this.currentIndex,
            displayIndex: startIndex + index + 1
        }));
    }
}

// Global history manager instance
let historyManager;

// Initialize history manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    historyManager = new HistoryManager();
    
    // Load saved history if available
    const savedHistory = Utils.Storage.load('whiteboard_history');
    if (savedHistory && savedHistory.history && savedHistory.history.length > 0) {
        historyManager.history = savedHistory.history;
        historyManager.currentIndex = savedHistory.currentIndex || -1;
        historyManager.updateUI();
    }
    
    // Save history periodically
    setInterval(() => {
        if (historyManager && historyManager.history.length > 0) {
            Utils.Storage.save('whiteboard_history', {
                history: historyManager.history,
                currentIndex: historyManager.currentIndex
            });
        }
    }, 30000); // Save every 30 seconds
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoryManager;
}
