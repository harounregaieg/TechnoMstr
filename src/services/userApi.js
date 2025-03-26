// src/services/userApi.js
import axios from "axios";

const API_URL = 'http://localhost:3000/api'; // Adjust if your API is hosted elsewhere

export const userApi = {
  async getUsers() {
    try {
      const response = await axios.get(`${API_URL}/users`);
      return response.data;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  async deleteUser(userId) {
    try {
      const response = await axios.delete(`${API_URL}/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  },

  // Add more methods as needed for other API operations
  // For example:
  // async createUser(userData) { ... }
  // async updateUser(userId, userData) { ... }
};