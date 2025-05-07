import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

/**
 * Fetch equipment statistics
 * @param {string} departement - Optional department to filter statistics by
 */
export const fetchEquipmentStats = async (departement) => {
  try {
    const params = {};
    if (departement) {
      params.departement = departement;
    }
    
    const response = await axios.get(`${API_URL}/dashboard/equipment-stats`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching equipment statistics:', error);
    throw error;
  }
};

/**
 * Fetch user statistics
 * @param {string} departement - Department to filter by
 */
export const fetchUserStats = async (departement) => {
  try {
    const response = await axios.get(`${API_URL}/dashboard/user-stats`, {
      params: { departement }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    throw error;
  }
};

/**
 * Fetch and calculate equipment status statistics
 * @param {string} departement - Optional department to filter by
 */
export const fetchEquipmentStatusStats = async (departement = null) => {
  try {
    const response = await axios.get(`${API_URL}/equipment`);
    let equipment = response.data;
    
    // Filter by department if specified and not TechnoCode
    if (departement && departement !== 'TechnoCode') {
      console.log(`Filtering equipment by department: ${departement}`);
      equipment = equipment.filter(item => item.departement === departement);
    }
    
    let ok = 0;
    let warning = 0;
    let error = 0;
    
    equipment.forEach(item => {
      if (item.disponibilite && (item.type === 'PDA' || item.printer_status === 'READY')) {
        ok++;
      } else if (item.disponibilite && item.printer_status === 'PAUSED' && 
                (!item.status_message || !item.status_message.toUpperCase().includes('ERROR'))) {
        warning++;
      } else if (!item.disponibilite || (item.type !== 'PDA' && 
                (item.printer_status === 'OFFLINE' || 
                (item.printer_status === 'PAUSED' && item.status_message?.toUpperCase().includes('ERROR'))))) {
        error++;
      }
    });
    
    const total = equipment.length;
    
    return {
      ok,
      warning,
      error,
      okPercentage: total > 0 ? Math.round((ok / total) * 100) : 0,
      warningPercentage: total > 0 ? Math.round((warning / total) * 100) : 0,
      errorPercentage: total > 0 ? Math.round((error / total) * 100) : 0
    };
  } catch (error) {
    console.error('Error fetching equipment status statistics:', error);
    throw error;
  }
};

/**
 * Fetch and calculate brand distribution statistics
 * @param {string} departement - Optional department to filter by
 */
export const fetchBrandStats = async (departement = null) => {
  try {
    const response = await axios.get(`${API_URL}/equipment`);
    let equipment = response.data;
    
    // Filter by department if specified and not TechnoCode
    if (departement && departement !== 'TechnoCode') {
      console.log(`Filtering equipment brands by department: ${departement}`);
      equipment = equipment.filter(item => item.departement === departement);
    }
    
    // Initialize counters for each brand
    const brands = {
      zebra: 0,
      sato: 0,
      other: 0
    };
    
    // Count equipment by brand
    equipment.forEach(item => {
      const brand = item.marque?.toLowerCase();
      if (brand) {
        if (brand.includes('zebra')) {
          brands.zebra++;
        } else if (brand.includes('sato')) {
          brands.sato++;
        } else {
          brands.other++;
        }
      } else {
        // If printerType exists and marque doesn't, use printerType
        const printerType = item.printerType?.toLowerCase() || 
                          item.printer_type?.toLowerCase();
        
        if (printerType) {
          if (printerType.includes('zebra')) {
            brands.zebra++;
          } else if (printerType.includes('sato')) {
            brands.sato++;
          } else {
            brands.other++;
          }
        } else {
          brands.other++;
        }
      }
    });
    
    return brands;
  } catch (error) {
    console.error('Error fetching brand statistics:', error);
    throw error;
  }
};

/**
 * Fetch recent activity
 * @param {number} limit - Maximum number of activities to fetch
 */
export const fetchRecentActivity = async (limit = 3) => {
  try {
    // Fetch both ticket and equipment activities
    const [ticketResponse, equipmentResponse] = await Promise.all([
      // Ticket activities
      axios.get(`${API_URL}/tickets/activities/recent`, {
        params: { limit: limit * 2 } // Fetch more to allow for sorting
      }).catch((error) => {
        console.warn('Failed to fetch ticket activities:', error);
        return { data: [] };
      }),
      
      // Equipment activities
      axios.get(`${API_URL}/equipment/activities/recent`, {
        params: { limit: limit * 2 } // Fetch more to allow for sorting
      }).catch((error) => {
        console.warn('Failed to fetch equipment activities:', error);
        return { data: [] };
      })
    ]);
    
    // Map ticket activities to the format expected by ActivityFeed component
    const ticketActivities = ticketResponse.data.map(activity => ({
      id: `ticket-${activity.idticket || Date.now()}`,
      type: activity.activity_type === 'created' ? 'success' : 'update',
      message: activity.message,
      timestamp: activity.activity_time
    }));
    
    // Map equipment activities
    const equipmentActivities = equipmentResponse.data.map(activity => ({
      id: `equipment-${activity.idequipement || Date.now()}`,
      type: activity.activity_type === 'added' ? 'success' : 'alert',
      message: activity.message,
      timestamp: activity.activity_time
    }));
    
    // If both endpoints fail, add a fallback item
    const allActivities = [...ticketActivities, ...equipmentActivities];
    
    if (allActivities.length === 0) {
      // Add fallback items
      allActivities.push({
        id: `fallback-${Date.now()}`,
        type: 'info',
        message: 'System is monitoring ticket and equipment activity',
        timestamp: new Date().toISOString()
      });
    }
    
    // Sort by timestamp (most recent first), and limit
    return allActivities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    // Return a fallback item instead of an empty array
    return [{
      id: `error-${Date.now()}`,
      type: 'info',
      message: 'Activity feed will update when new events occur',
      timestamp: new Date().toISOString()
    }];
  }
};

/**
 * Fetch printer command history data grouped by day
 * @param {number} days - Number of days to look back
 * @param {string} departement - Optional department to filter by
 */
export const fetchCommandHistory = async (days = 7, departement = null) => {
  try {
    console.log(`Fetching command history for the last ${days} days${departement ? ` for department: ${departement}` : ''}`);
    
    const params = { days };
    if (departement) {
      params.departement = departement;
    }
    
    const response = await axios.get(`${API_URL}/dashboard/commands-history`, { params });
    
    // Day mapping from English to French
    const dayMapping = {
      'Mon': 'Lun',
      'Tue': 'Mar',
      'Wed': 'Mer',
      'Thu': 'Jeu',
      'Fri': 'Ven',
      'Sat': 'Sam',
      'Sun': 'Dim'
    };
    
    // Initialize a full week of data with zeros
    const daysOfWeek = [
      { name: 'Lun', count: 0 },
      { name: 'Mar', count: 0 },
      { name: 'Mer', count: 0 },
      { name: 'Jeu', count: 0 },
      { name: 'Ven', count: 0 }
    ];
    
    // Fill in the actual data where available
    const apiData = response.data;
    console.log('API returned command history data:', apiData);
    
    if (apiData && Array.isArray(apiData)) {
      apiData.forEach(item => {
        // Extract day and normalize to 3 characters if needed
        const apiDay = (item.day || '').substring(0, 3);
        
        // Find the corresponding day in our week array
        const frenchDay = dayMapping[apiDay] || apiDay;
        const dayIndex = daysOfWeek.findIndex(d => d.name === frenchDay);
        
        if (dayIndex !== -1) {
          daysOfWeek[dayIndex].count = parseInt(item.count || 0);
        } else {
          console.warn(`Could not match day abbreviation: ${apiDay}`);
        }
      });
    }
    
    console.log('Mapped command history data:', daysOfWeek);
    return daysOfWeek;
  } catch (error) {
    console.error('Error fetching command history:', error);
    console.error('Error details:', error.response?.data || error.message);
    // Return default data on error
    return [
      { name: 'Lun', count: 0 },
      { name: 'Mar', count: 0 },
      { name: 'Mer', count: 0 },
      { name: 'Jeu', count: 0 },
      { name: 'Ven', count: 0 }
    ];
  }
};

/**
 * Fetch equipment counts by type (printers and PDAs)
 * @param {string} departement - Optional department to filter by
 */
export const fetchEquipmentTypeStats = async (departement = null) => {
  try {
    const response = await axios.get(`${API_URL}/equipment`);
    let equipment = response.data;
    
    // Filter by department if specified and not TechnoCode
    if (departement && departement !== 'TechnoCode') {
      console.log(`Filtering equipment types by department: ${departement}`);
      equipment = equipment.filter(item => item.departement === departement);
    }
    
    let printers = 0;
    let pdas = 0;
    
    equipment.forEach(item => {
      if (item.type === 'PDA') {
        pdas++;
      } else {
        // Count as printer any non-PDA equipment
        printers++;
      }
    });
    
    return {
      printers,
      pdas,
      total: printers + pdas
    };
  } catch (error) {
    console.error('Error fetching equipment type statistics:', error);
    throw error;
  }
};

/**
 * Fetch ticket creation history data grouped by day
 * @param {number} days - Number of days to look back
 * @param {string} departement - Optional department to filter by
 */
export const fetchTicketHistory = async (days = 7, departement = null) => {
  try {
    console.log(`Fetching ticket history for the last ${days} days${departement ? ` for department: ${departement}` : ''}`);
    
    const params = { days };
    if (departement) {
      params.departement = departement;
    }
    
    const response = await axios.get(`${API_URL}/dashboard/ticket-history`, { params });
    
    // Day mapping from English to French
    const dayMapping = {
      'Mon': 'Lun',
      'Tue': 'Mar',
      'Wed': 'Mer',
      'Thu': 'Jeu',
      'Fri': 'Ven',
      'Sat': 'Sam',
      'Sun': 'Dim'
    };
    
    // Initialize a full week of data with zeros
    const daysOfWeek = [
      { name: 'Lun', count: 0 },
      { name: 'Mar', count: 0 },
      { name: 'Mer', count: 0 },
      { name: 'Jeu', count: 0 },
      { name: 'Ven', count: 0 }
    ];
    
    // Fill in the actual data where available
    const apiData = response.data;
    console.log('API returned ticket history data:', apiData);
    
    if (apiData && Array.isArray(apiData)) {
      apiData.forEach(item => {
        // Extract day and normalize to 3 characters if needed
        const apiDay = (item.day || '').substring(0, 3);
        
        // Find the corresponding day in our week array
        const frenchDay = dayMapping[apiDay] || apiDay;
        const dayIndex = daysOfWeek.findIndex(d => d.name === frenchDay);
        
        if (dayIndex !== -1) {
          daysOfWeek[dayIndex].count = parseInt(item.count || 0);
        } else {
          console.warn(`Could not match day abbreviation: ${apiDay}`);
        }
      });
    }
    
    console.log('Mapped ticket history data:', daysOfWeek);
    return daysOfWeek;
  } catch (error) {
    console.error('Error fetching ticket history:', error);
    console.error('Error details:', error.response?.data || error.message);
    // Return default data on error
    return [
      { name: 'Lun', count: 0 },
      { name: 'Mar', count: 0 },
      { name: 'Mer', count: 0 },
      { name: 'Jeu', count: 0 },
      { name: 'Ven', count: 0 }
    ];
  }
}; 