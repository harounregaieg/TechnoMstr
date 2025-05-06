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

  async getUserById(userId) {
    try {
      const response = await axios.get(`${API_URL}/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      throw error;
    }
  },

  async createUser(userData) {
    try {
      const response = await axios.post(`${API_URL}/users`, userData);
      return response.data;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  async updateUser(userId, userData) {
    try {
      const response = await axios.put(`${API_URL}/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error);
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

  toggleUserStatus: async (userId) => {
    try {
      const response = await axios.patch(`${API_URL}/users/${userId}/toggle-status`);
      return response.data;
    } catch (error) {
      console.error("Error toggling user status:", error);
      throw error;
    }
  },

  async getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('No user in localStorage');
      const user = JSON.parse(userStr);
      const response = await axios.get(`${API_URL}/users/current?email=${encodeURIComponent(user.email)}`);
      console.log('Current user API response:', response.data);
      
      // Ensure the data has a department field
      if (response.data && !response.data.departement && !response.data.nomdepartement) {
        // Get the user's department from another endpoint if needed
        try {
          const userDetailsResponse = await axios.get(`${API_URL}/users/${response.data.id}`);
          if (userDetailsResponse.data && (userDetailsResponse.data.departement || userDetailsResponse.data.nomdepartement)) {
            response.data.departement = userDetailsResponse.data.departement || userDetailsResponse.data.nomdepartement;
          }
        } catch (detailsError) {
          console.error("Error fetching user details:", detailsError);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error("Error fetching current user:", error);
      throw error;
    }
  },

};