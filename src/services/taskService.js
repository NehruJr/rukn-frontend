import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const taskService = {
  /**
   * Get all tasks with optional filters
   */
  async getTasks(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await axios.get(`${API_URL}/tasks?${params.toString()}`);
    return response.data;
  },

  /**
   * Get tasks for calendar view (within date range)
   */
  async getCalendarTasks(startDate, endDate, assignedTo = null) {
    const params = new URLSearchParams({ startDate, endDate });
    if (assignedTo) params.append('assignedTo', assignedTo);
    
    const response = await axios.get(`${API_URL}/tasks/calendar?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single task by ID
   */
  async getTask(id) {
    const response = await axios.get(`${API_URL}/tasks/${id}`);
    return response.data;
  },

  /**
   * Create new task
   */
  async createTask(taskData) {
    const response = await axios.post(`${API_URL}/tasks`, taskData);
    return response.data;
  },

  /**
   * Update task
   */
  async updateTask(id, taskData) {
    const response = await axios.put(`${API_URL}/tasks/${id}`, taskData);
    return response.data;
  },

  /**
   * Mark task as complete
   */
  async completeTask(id, completionNotes = '') {
    const response = await axios.patch(`${API_URL}/tasks/${id}/complete`, { completionNotes });
    return response.data;
  },

  /**
   * Delete task
   */
  async deleteTask(id) {
    const response = await axios.delete(`${API_URL}/tasks/${id}`);
    return response.data;
  }
};

export { taskService };
