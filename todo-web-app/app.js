// SkillCraft To-Do App - Main JavaScript File

class SkillCraftTodoApp {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.draggedElement = null;
        this.editingTaskId = null;
        
        this.init();
    }

    init() {
        this.loadTasksFromStorage();
        this.bindEvents();
        this.render();
        this.updateStats();
        
        // Load sample data if no tasks exist
        if (this.tasks.length === 0) {
            this.loadSampleData();
        }
    }

    loadSampleData() {
        const sampleTasks = [
            {
                id: this.generateId(),
                text: "Complete project documentation",
                completed: false,
                created: new Date().toISOString(),
                priority: "high"
            },
            {
                id: this.generateId(),
                text: "Review code implementation",
                completed: false,
                created: new Date().toISOString(),
                priority: "medium"
            },
            {
                id: this.generateId(),
                text: "Deploy to production",
                completed: true,
                created: new Date().toISOString(),
                priority: "high"
            }
        ];
        
        this.tasks = sampleTasks;
        this.saveTasksToStorage();
        this.render();
        this.updateStats();
    }

    bindEvents() {
        // Task input events
        const taskInput = document.getElementById('taskInput');
        const addTaskBtn = document.getElementById('addTaskBtn');
        
        addTaskBtn.addEventListener('click', () => this.addTask());
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });

        // Filter events
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Search events
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.render();
        });

        // Clear completed button
        document.getElementById('clearCompletedBtn').addEventListener('click', () => {
            this.clearCompleted();
        });

        // Export/Import events
        document.getElementById('exportBtn').addEventListener('click', () => this.exportTasks());
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        document.getElementById('importFile').addEventListener('change', (e) => this.importTasks(e));

        // Modal events
        document.getElementById('confirmBtn').addEventListener('click', () => this.handleConfirm());
        document.getElementById('cancelBtn').addEventListener('click', () => this.hideModal());
        
        // Close modal on background click
        document.getElementById('confirmModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.hideModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.cancelEdit();
                this.hideModal();
            }
        });
    }

    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    addTask() {
        const taskInput = document.getElementById('taskInput');
        const prioritySelect = document.getElementById('prioritySelect');
        const text = taskInput.value.trim();

        if (!text) {
            this.showNotification('Please enter a task description', 'error');
            taskInput.focus();
            return;
        }

        if (text.length > 200) {
            this.showNotification('Task description is too long (max 200 characters)', 'error');
            return;
        }

        const task = {
            id: this.generateId(),
            text: text,
            completed: false,
            created: new Date().toISOString(),
            priority: prioritySelect.value
        };

        this.tasks.unshift(task);
        this.saveTasksToStorage();
        this.render();
        this.updateStats();

        // Clear input
        taskInput.value = '';
        prioritySelect.value = 'medium';
        
        this.showNotification('Task added successfully!', 'success');
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasksToStorage();
            this.render();
            this.updateStats();
            
            const status = task.completed ? 'completed' : 'reactivated';
            this.showNotification(`Task ${status}!`, 'success');
        }
    }

    editTask(taskId) {
        if (this.editingTaskId) {
            this.cancelEdit();
        }
        
        this.editingTaskId = taskId;
        this.render();
        
        // Focus on edit input and select all text
        setTimeout(() => {
            const editInput = document.querySelector(`[data-task-id="${taskId}"] .edit-input`);
            if (editInput) {
                editInput.focus();
                editInput.select();
            }
        }, 10);
    }

    saveEdit(taskId) {
        const editInput = document.querySelector(`[data-task-id="${taskId}"] .edit-input`);
        if (!editInput) return;
        
        const newText = editInput.value.trim();

        if (!newText) {
            this.showNotification('Task description cannot be empty', 'error');
            editInput.focus();
            return;
        }

        if (newText.length > 200) {
            this.showNotification('Task description is too long (max 200 characters)', 'error');
            return;
        }

        const task = this.tasks.find(t => t.id === taskId);
        if (task && task.text !== newText) {
            task.text = newText;
            this.saveTasksToStorage();
            this.showNotification('Task updated successfully!', 'success');
        }
        
        this.editingTaskId = null;
        this.render();
    }

    cancelEdit() {
        if (this.editingTaskId) {
            this.editingTaskId = null;
            this.render();
        }
    }

    deleteTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            this.showConfirmModal(
                `Are you sure you want to delete "${task.text}"?`,
                () => {
                    this.tasks = this.tasks.filter(t => t.id !== taskId);
                    this.saveTasksToStorage();
                    this.render();
                    this.updateStats();
                    this.showNotification('Task deleted successfully!', 'success');
                }
            );
        }
    }

    clearCompleted() {
        const completedTasks = this.tasks.filter(t => t.completed);
        if (completedTasks.length === 0) {
            this.showNotification('No completed tasks to clear', 'info');
            return;
        }

        this.showConfirmModal(
            `Are you sure you want to delete ${completedTasks.length} completed task(s)?`,
            () => {
                this.tasks = this.tasks.filter(t => !t.completed);
                this.saveTasksToStorage();
                this.render();
                this.updateStats();
                this.showNotification(`${completedTasks.length} completed tasks cleared!`, 'success');
            }
        );
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.render();
    }

    getFilteredTasks() {
        let filtered = this.tasks;

        // Apply filter
        switch (this.currentFilter) {
            case 'active':
                filtered = filtered.filter(task => !task.completed);
                break;
            case 'completed':
                filtered = filtered.filter(task => task.completed);
                break;
        }

        // Apply search
        if (this.searchTerm) {
            filtered = filtered.filter(task => 
                task.text.toLowerCase().includes(this.searchTerm)
            );
        }

        return filtered;
    }

    render() {
        const taskList = document.getElementById('taskList');
        const emptyState = document.getElementById('emptyState');
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            taskList.innerHTML = '';
            emptyState.classList.remove('hidden');
            
            // Update empty state message based on filter
            const emptyMessage = emptyState.querySelector('p');
            if (this.searchTerm) {
                emptyMessage.textContent = `No tasks found for "${this.searchTerm}"`;
            } else if (this.currentFilter === 'active') {
                emptyMessage.textContent = 'No active tasks. Great job! 🎉';
            } else if (this.currentFilter === 'completed') {
                emptyMessage.textContent = 'No completed tasks yet. Get to work! 💪';
            } else {
                emptyMessage.textContent = 'Add your first task above to get started!';
            }
        } else {
            emptyState.classList.add('hidden');
            taskList.innerHTML = filteredTasks.map(task => this.renderTask(task)).join('');
            this.bindTaskEvents();
        }
    }

    renderTask(task) {
        const createdDate = new Date(task.created).toLocaleDateString();
        const isEditing = this.editingTaskId === task.id;
        
        if (isEditing) {
            return `
                <div class="task-item ${task.completed ? 'completed' : ''} editing" 
                     data-task-id="${task.id}" 
                     role="listitem">
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                         onclick="app.toggleTask('${task.id}')"
                         role="checkbox"
                         aria-checked="${task.completed}"
                         tabindex="0"></div>
                    
                    <div class="task-edit-form">
                        <input type="text" 
                               class="form-control edit-input" 
                               value="${this.escapeHtml(task.text)}" 
                               maxlength="200">
                        <div class="edit-actions">
                            <button class="btn btn--sm btn--primary save-edit" 
                                    onclick="app.saveEdit('${task.id}')">Save</button>
                            <button class="btn btn--sm btn--secondary cancel-edit" 
                                    onclick="app.cancelEdit()">Cancel</button>
                        </div>
                    </div>
                    
                    <span class="priority-badge ${task.priority}">${task.priority}</span>
                    
                    <span class="task-timestamp">${createdDate}</span>
                    
                    <div class="task-item-actions">
                        <button class="action-btn edit" 
                                onclick="app.editTask('${task.id}')"
                                title="Edit task"
                                aria-label="Edit task">
                            ✏️
                        </button>
                        <button class="action-btn delete" 
                                onclick="app.deleteTask('${task.id}')"
                                title="Delete task"
                                aria-label="Delete task">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="task-item ${task.completed ? 'completed' : ''}" 
                     data-task-id="${task.id}" 
                     draggable="true"
                     role="listitem">
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                         onclick="app.toggleTask('${task.id}')"
                         role="checkbox"
                         aria-checked="${task.completed}"
                         tabindex="0"></div>
                    
                    <div class="task-text" ondblclick="app.editTask('${task.id}')">${this.escapeHtml(task.text)}</div>
                    
                    <span class="priority-badge ${task.priority}">${task.priority}</span>
                    
                    <span class="task-timestamp">${createdDate}</span>
                    
                    <div class="task-item-actions">
                        <button class="action-btn edit" 
                                onclick="app.editTask('${task.id}')"
                                title="Edit task"
                                aria-label="Edit task">
                            ✏️
                        </button>
                        <button class="action-btn delete" 
                                onclick="app.deleteTask('${task.id}')"
                                title="Delete task"
                                aria-label="Delete task">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    bindTaskEvents() {
        const taskItems = document.querySelectorAll('.task-item');
        
        taskItems.forEach(item => {
            // Skip drag events for items being edited
            if (item.classList.contains('editing')) {
                // Bind keyboard events for edit input
                const editInput = item.querySelector('.edit-input');
                if (editInput) {
                    editInput.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            const taskId = item.dataset.taskId;
                            this.saveEdit(taskId);
                        } else if (e.key === 'Escape') {
                            e.preventDefault();
                            this.cancelEdit();
                        }
                    });
                }
                return;
            }
            
            // Drag and drop events
            item.addEventListener('dragstart', (e) => {
                this.draggedElement = e.target;
                e.target.classList.add('dragging');
            });
            
            item.addEventListener('dragend', (e) => {
                e.target.classList.remove('dragging');
                this.draggedElement = null;
            });
            
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                if (this.draggedElement && this.draggedElement !== e.currentTarget) {
                    this.reorderTasks(this.draggedElement, e.currentTarget);
                }
            });

            // Keyboard navigation for checkbox
            const checkbox = item.querySelector('.task-checkbox');
            if (checkbox) {
                checkbox.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const taskId = item.dataset.taskId;
                        this.toggleTask(taskId);
                    }
                });
            }
        });
    }

    reorderTasks(draggedItem, dropTarget) {
        const draggedId = draggedItem.dataset.taskId;
        const dropTargetId = dropTarget.dataset.taskId;
        
        const draggedIndex = this.tasks.findIndex(t => t.id === draggedId);
        const dropIndex = this.tasks.findIndex(t => t.id === dropTargetId);
        
        if (draggedIndex !== -1 && dropIndex !== -1) {
            const draggedTask = this.tasks.splice(draggedIndex, 1)[0];
            this.tasks.splice(dropIndex, 0, draggedTask);
            
            this.saveTasksToStorage();
            this.render();
            this.showNotification('Tasks reordered!', 'success');
        }
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const active = total - completed;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('activeTasks').textContent = active;
        document.getElementById('completedTasks').textContent = completed;
    }

    exportTasks() {
        const exportData = {
            tasks: this.tasks,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `skillcraft-tasks-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Tasks exported successfully!', 'success');
    }

    importTasks(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                if (!importData.tasks || !Array.isArray(importData.tasks)) {
                    throw new Error('Invalid file format');
                }

                // Validate task structure
                const validTasks = importData.tasks.filter(task => 
                    task.id && task.text && typeof task.completed === 'boolean'
                );

                if (validTasks.length === 0) {
                    throw new Error('No valid tasks found in file');
                }

                this.showConfirmModal(
                    `Import ${validTasks.length} tasks? This will replace your current tasks.`,
                    () => {
                        this.tasks = validTasks;
                        this.saveTasksToStorage();
                        this.render();
                        this.updateStats();
                        this.showNotification(`${validTasks.length} tasks imported successfully!`, 'success');
                    }
                );

            } catch (error) {
                this.showNotification('Error importing tasks. Please check file format.', 'error');
                console.error('Import error:', error);
            }
        };
        
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    }

    showConfirmModal(message, onConfirm) {
        const modal = document.getElementById('confirmModal');
        const messageEl = document.getElementById('confirmMessage');
        
        messageEl.textContent = message;
        this.confirmCallback = onConfirm;
        
        modal.classList.remove('hidden');
        document.getElementById('confirmBtn').focus();
    }

    hideModal() {
        document.getElementById('confirmModal').classList.add('hidden');
        this.confirmCallback = null;
    }

    handleConfirm() {
        if (this.confirmCallback) {
            this.confirmCallback();
        }
        this.hideModal();
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        // Add notification styles if not already added
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 12px 16px;
                    border-radius: 8px;
                    color: white;
                    font-size: 14px;
                    font-weight: 500;
                    z-index: 1001;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    max-width: 300px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(10px);
                    animation: slideIn 0.3s ease-out;
                }
                
                .notification--success { background: rgba(34, 197, 94, 0.9); }
                .notification--error { background: rgba(239, 68, 68, 0.9); }
                .notification--info { background: rgba(59, 130, 246, 0.9); }
                
                .notification-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }

    saveTasksToStorage() {
        try {
            localStorage.setItem('skillcraft-todo-tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            this.showNotification('Error saving tasks', 'error');
        }
    }

    loadTasksFromStorage() {
        try {
            const stored = localStorage.getItem('skillcraft-todo-tasks');
            if (stored) {
                this.tasks = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            this.tasks = [];
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SkillCraftTodoApp();
});

// Handle visibility change to sync data
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.app) {
        window.app.loadTasksFromStorage();
        window.app.render();
        window.app.updateStats();
    }
});