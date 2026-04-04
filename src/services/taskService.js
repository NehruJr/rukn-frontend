import api from './api';
 
const taskService = {
  /**
   * Get all tasks with optional filters
   */
  async getTasks(params = {}) {
    const response = await api.get('/tasks', { params });
    return response.data;
  },
 
  /**
   * Get tasks for calendar view (within date range)
   */
  async getCalendarTasks(startDate, endDate, assignedTo = null) {
    const params = { startDate, endDate };
    if (assignedTo) params.assignedTo = assignedTo;
    
    const response = await api.get('/tasks/calendar', { params });
    return response.data;
  },
 
  /**
   * Get single task by ID
   */
  async getTask(id) {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },
 
  /**
   * Create new task
   */
  async createTask(taskData) {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },
 
  /**
   * Update task
   */
  async updateTask(id, taskData) {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },
 
  /**
   * Mark task as complete
   */
  async completeTask(id, completionNotes = '') {
    const response = await api.patch(`/tasks/${id}/complete`, { completionNotes });
    return response.data;
  },
 
  /**
   * Delete task
   */
  async deleteTask(id) {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  }
};
 
export { taskService };
