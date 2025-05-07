const { localPool } = require('../config/db');
const equipmentRepository = require('../models/equipmentRepository');
const User = require('../models/userModel');

/**
 * Get equipment statistics for the dashboard
 */
exports.getEquipmentStats = async (req, res) => {
  try {
    const { departement } = req.query;
    console.log(`Fetching equipment statistics for department: ${departement || 'All'}`);
    const stats = await equipmentRepository.getEquipmentStatistics(departement);
    console.log('Equipment stats result:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error getting equipment stats:', error);
    res.status(500).json({ error: 'Failed to get equipment statistics' });
  }
};

/**
 * Get user statistics for the dashboard
 */
exports.getUserStats = async (req, res) => {
  try {
    const { departement } = req.query;
    console.log(`Fetching user statistics for department: ${departement}`);
    
    if (!departement) {
      return res.status(400).json({ error: 'Department is required' });
    }
    
    const stats = await User.getStatistics(departement);
    console.log('User stats result:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ error: 'Failed to get user statistics' });
  }
};

/**
 * Get command history data for the dashboard
 * Groups commands by day of the week (Monday to Friday)
 */
exports.getCommandHistory = async (req, res) => {
  try {
    const days = req.query.days || 7;
    
    // Get commands from the last X days
    const query = `
      SELECT 
        DAYNAME(date_action) as day_name,
        COUNT(*) as command_count
      FROM action
      WHERE 
        type_action = 'command' 
        AND date_action >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND DAYOFWEEK(date_action) BETWEEN 2 AND 6 -- Monday (2) to Friday (6)
      GROUP BY day_name
      ORDER BY FIELD(day_name, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
    `;
    
    const [results] = await db.promise().query(query, [days]);
    
    // Format the data for the frontend
    const formattedResults = results.map(row => {
      let shortDay;
      
      // Convert full day name to abbreviated format
      switch(row.day_name) {
        case 'Monday': shortDay = 'Mon'; break;
        case 'Tuesday': shortDay = 'Tue'; break;
        case 'Wednesday': shortDay = 'Wed'; break;
        case 'Thursday': shortDay = 'Thu'; break;
        case 'Friday': shortDay = 'Fri'; break;
        default: shortDay = row.day_name.substr(0, 3);
      }
      
      return {
        day: shortDay,
        count: row.command_count
      };
    });
    
    res.json(formattedResults);
  } catch (error) {
    console.error('Error getting command history:', error);
    res.status(500).json({ error: 'Failed to get command history' });
  }
};

/**
 * Get command history grouped by day
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getCommandsHistory = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const departement = req.query.departement;
    
    console.log(`Getting command history for the last ${days} days${departement ? ` for department: ${departement}` : ''}`);
    
    const { localPool } = require('../config/db');
    
    // Base query for command history
    let query = `
      SELECT 
        EXTRACT(DOW FROM a.executed_at) as dow,
        TO_CHAR(a.executed_at, 'Dy') as day,
        COUNT(*) as count
      FROM action a
    `;
    
    // If department filter is provided and not TechnoCode, join with equipment table
    const params = [];
    if (departement && departement !== 'TechnoCode') {
      query += `
        JOIN equipement e ON a.idequipement = e.idequipement
        WHERE a.executed_at >= NOW() - INTERVAL '${days} days'
        AND e.departement = $1
      `;
      params.push(departement);
    } else {
      query += `
        WHERE a.executed_at >= NOW() - INTERVAL '${days} days'
      `;
    }
    
    // Complete the query with group by and order by
    query += `
      GROUP BY dow, day
      ORDER BY dow
    `;
    
    console.log('Executing query:', query);
    console.log('Query params:', params);
    
    const result = await localPool.query(query, params);
    console.log(`Query returned ${result.rows.length} rows:`, result.rows);
    
    // If no data is found, create a default dataset
    if (result.rows.length === 0) {
      console.log('No command history found, creating default dataset');
      
      // Return a default dataset
      return res.json([
        { day: 'Mon', count: 0 },
        { day: 'Tue', count: 0 },
        { day: 'Wed', count: 0 },
        { day: 'Thu', count: 0 },
        { day: 'Fri', count: 0 }
      ]);
    }
    
    // Return the actual data
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching command history:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Return default data on error
    res.json([
      { day: 'Mon', count: 0 },
      { day: 'Tue', count: 0 },
      { day: 'Wed', count: 0 },
      { day: 'Thu', count: 0 },
      { day: 'Fri', count: 0 }
    ]);
  }
};

/**
 * Debugging endpoint to check database structure
 */
exports.checkActionTable = async (req, res) => {
  try {
    const { localPool } = require('../config/db');
    
    // Check if the table exists
    const tableCheck = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'action'
      ) as exists_bool
    `;
    
    const tableExists = await localPool.query(tableCheck);
    
    if (!tableExists.rows[0].exists_bool) {
      return res.json({ 
        exists: false, 
        message: "Action table doesn't exist",
        tables: await getAvailableTables(localPool)
      });
    }
    
    // Check table structure
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'action'
      ORDER BY ordinal_position
    `;
    
    const columns = await localPool.query(columnsQuery);
    
    // Get sample data
    const sampleQuery = `
      SELECT * FROM action
      LIMIT 3
    `;
    
    let sampleData = [];
    try {
      const sampleResult = await localPool.query(sampleQuery);
      sampleData = sampleResult.rows;
    } catch (e) {
      console.warn('Error fetching sample data:', e.message);
    }
    
    res.json({
      exists: true,
      columns: columns.rows,
      sampleCount: sampleData.length,
      sampleData: sampleData
    });
  } catch (error) {
    console.error('Error checking action table:', error);
    res.status(500).json({ error: 'Failed to check action table', message: error.message });
  }
};

// Helper function to get available tables
async function getAvailableTables(pool) {
  try {
    const query = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    const result = await pool.query(query);
    return result.rows.map(row => row.table_name);
  } catch (error) {
    console.error('Error getting available tables:', error);
    return [];
  }
}

/**
 * Get ticket creation history grouped by day
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getTicketHistory = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const departement = req.query.departement;
    
    console.log(`Getting ticket history for the last ${days} days${departement ? ` for department: ${departement}` : ''}`);
    
    // Base query for ticket count by day
    let query = `
      SELECT 
        EXTRACT(DOW FROM t.created_at) as dow,
        TO_CHAR(t.created_at, 'Dy') as day,
        COUNT(*) as count
      FROM ticket t
    `;
    
    // If department filter is provided and not TechnoCode, join with equipment table
    const params = [];
    if (departement && departement !== 'TechnoCode') {
      // The ticket has serialnumber, but equipment doesn't have a serialnumber column directly
      // We need to join through the imprimante table
      query += `
        LEFT JOIN imprimante i ON i.serialnumber = t.serialnumber
        LEFT JOIN equipement e ON i.idequipement = e.idequipement
        WHERE t.created_at >= NOW() - INTERVAL '${days} days'
        AND (e.departement = $1)
      `;
      params.push(departement);
    } else {
      query += `
        WHERE t.created_at >= NOW() - INTERVAL '${days} days'
      `;
    }
    
    // Complete the query with group by and order by
    query += `
      GROUP BY dow, day
      ORDER BY dow
    `;
    
    console.log('Executing ticket history query:', query);
    console.log('Query params:', params);
    
    const result = await localPool.query(query, params);
    console.log(`Query returned ${result.rows.length} rows:`, result.rows);
    
    // If no data is found, create a default dataset
    if (result.rows.length === 0) {
      console.log('No ticket history found, creating default dataset');
      
      // Return a default dataset
      return res.json([
        { day: 'Mon', count: 0 },
        { day: 'Tue', count: 0 },
        { day: 'Wed', count: 0 },
        { day: 'Thu', count: 0 },
        { day: 'Fri', count: 0 }
      ]);
    }
    
    // Return the actual data
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ticket history:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Return default data on error
    res.json([
      { day: 'Mon', count: 0 },
      { day: 'Tue', count: 0 },
      { day: 'Wed', count: 0 },
      { day: 'Thu', count: 0 },
      { day: 'Fri', count: 0 }
    ]);
  }
}; 