const { localPool, cloudPool } = require('../config/db');

class TicketRepository {
  /**
   * Add new ticket to both local and cloud databases
   * @param {Object} ticket Ticket information
   * @returns {Promise<Object>} created ticket
   */
  async createTicket(ticket) {
    console.log('Creating ticket with data:', ticket);

    // Validate required fields
    const requiredFields = ['sujet', 'serialnumber', 'agent', 'requester', 'priority'];
    const missingFields = requiredFields.filter(field => !ticket[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const {
      sujet,
      serialnumber,
      agent,
      requester,
      priority,
      piecesaremplacer = '', // Match exact database column name
      description = ''
    } = ticket;

    // Validate that serial number exists in either imprimante or pda table
    try {
      // Check local database first - both printer and pda tables
      const [localPrinterCheck, localPdaCheck] = await Promise.all([
        localPool.query('SELECT serialnumber FROM imprimante WHERE serialnumber = $1', [serialnumber]),
        localPool.query('SELECT serialnumber FROM pda WHERE serialnumber = $1', [serialnumber])
      ]);
      
      let equipmentFoundInLocal = localPrinterCheck.rowCount > 0 || localPdaCheck.rowCount > 0;
      console.log(`Equipment found in local database: ${equipmentFoundInLocal}`);
      
      // Try cloud database if not found locally, with better error handling
      let equipmentFoundInCloud = false;
      try {
        // Try printer table in cloud
        const cloudPrinterCheck = await cloudPool.query('SELECT serialnumber FROM imprimante WHERE serialnumber = $1', [serialnumber]);
        equipmentFoundInCloud = cloudPrinterCheck.rowCount > 0;
        
        // If not found in printer table, try pda table with different column name options
        if (!equipmentFoundInCloud) {
          try {
            // Try with lowercase column name
            const cloudPdaCheck = await cloudPool.query('SELECT serialnumber FROM pda WHERE serialnumber = $1', [serialnumber]);
            equipmentFoundInCloud = cloudPdaCheck.rowCount > 0;
          } catch (pdaError) {
            // If there's an error, try with a different column name format (serialNumber)
            try {
              const cloudPdaCheck2 = await cloudPool.query('SELECT "serialNumber" FROM pda WHERE "serialNumber" = $1', [serialnumber]);
              equipmentFoundInCloud = cloudPdaCheck2.rowCount > 0;
            } catch (pdaError2) {
              console.warn('Error checking PDA in cloud database. Trying to continue with local validation only.');
              console.warn(pdaError2.message);
            }
          }
        }
        console.log(`Equipment found in cloud database: ${equipmentFoundInCloud}`);
      } catch (cloudError) {
        console.warn('Warning: Error checking equipment in cloud database:', cloudError.message);
        // Continue with only local validation if cloud DB check fails
      }
      
      // If equipment is not found in either database
      if (!equipmentFoundInLocal && !equipmentFoundInCloud) {
        throw new Error(`Equipment with serial number ${serialnumber} not found in either database`);
      }
    } catch (error) {
      console.error('Error checking equipment:', error);
      throw new Error(`Error validating equipment: ${error.message}`);
    }

    // Get user emails from local database
    const [agentResult, requesterResult] = await Promise.all([
      localPool.query('SELECT email FROM users WHERE id = $1', [agent]),
      localPool.query('SELECT email FROM users WHERE id = $1', [requester])
    ]);

    if (agentResult.rowCount === 0) {
      throw new Error(`Agent with ID ${agent} not found in local database`);
    }
    if (requesterResult.rowCount === 0) {
      throw new Error(`Requester with ID ${requester} not found in local database`);
    }

    const agentEmail = agentResult.rows[0].email;
    const requesterEmail = requesterResult.rows[0].email;

    // Get user IDs from cloud database using emails
    const [cloudAgentResult, cloudRequesterResult] = await Promise.all([
      cloudPool.query('SELECT id FROM users WHERE email = $1', [agentEmail]),
      cloudPool.query('SELECT id FROM users WHERE email = $1', [requesterEmail])
    ]);

    if (cloudAgentResult.rowCount === 0) {
      throw new Error(`Agent with email ${agentEmail} not found in cloud database`);
    }
    if (cloudRequesterResult.rowCount === 0) {
      throw new Error(`Requester with email ${requesterEmail} not found in cloud database`);
    }

    const cloudAgentId = cloudAgentResult.rows[0].id;
    const cloudRequesterId = cloudRequesterResult.rows[0].id;

    const query = `
      INSERT INTO ticket (
        sujet, 
        serialnumber, 
        agent, 
        requester, 
        priority, 
        piecesaremplacer,
        description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    try {
      // Insert into local database
      const localValues = [
        sujet, 
        serialnumber, 
        agent, 
        requester, 
        priority,
        piecesaremplacer,
        description
      ];
      
      // Insert into cloud database with cloud user IDs
      const cloudValues = [
        sujet, 
        serialnumber, 
        cloudAgentId, 
        cloudRequesterId, 
        priority,
        piecesaremplacer,
        description
      ];

      console.log('Executing queries with values:', {
        local: localValues,
        cloud: cloudValues
      });
      
      // Insert into both databases
      const [localResult, cloudResult] = await Promise.all([
        localPool.query(query, localValues),
        cloudPool.query(query, cloudValues)
      ]);
      
      console.log('Query results:', {
        local: localResult.rows[0],
        cloud: cloudResult.rows[0]
      });

      // Return the local result as primary response
      return localResult.rows[0];
    } catch (error) {
      console.error('Database error creating ticket:', {
        error: error.message,
        code: error.code,
        detail: error.detail,
        table: error.table,
        constraint: error.constraint
      });
      
      // Provide more specific error messages based on PostgreSQL error codes
      switch (error.code) {
        case '23503':
          throw new Error('Referenced record does not exist (foreign key violation)');
        case '23505':
          throw new Error('Duplicate record');
        default:
          throw new Error(`Database error: ${error.message}`);
      }
    }
  }

  /**
   * Get tickets for specific user from local database
   * @param {number} userId user ID
   * @param {string} role 'agent' or 'requester'
   * @returns {Promise<Array>} List of tickets
   */
  async getTicketsForUser(userId, role = 'agent') {
    const query = `
      SELECT 
        t.*,
        requester_user.prenom as requester_firstname,
        requester_user.nom as requester_lastname,
        agent_user.prenom as agent_firstname,
        agent_user.nom as agent_lastname
      FROM ticket t
      JOIN users requester_user ON t.requester = requester_user.id
      JOIN users agent_user ON t.agent = agent_user.id
      WHERE t.${role} = $1
      ORDER BY t.created_at DESC
    `;

    try {
      const result = await localPool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting tickets:', error);
      throw error;
    }
  }

  /**
   * Get single ticket by ID from local database
   * @param {number} ticketId ID of ticket to fetch
   * @returns {Promise<Object>} ticket with all details
   */
  async getTicketById(ticketId) {
    // First get basic ticket info
    const basicTicketQuery = `
      SELECT 
        t.*,
        req.prenom as requester_firstname,
        req.nom as requester_lastname,
        req.email as requester_email,
        ag.prenom as agent_firstname,
        ag.nom as agent_lastname,
        ag.email as agent_email
      FROM ticket t
      JOIN users req ON t.requester = req.id
      JOIN users ag ON t.agent = ag.id
      WHERE t.idticket = $1
    `;

    try {
      const ticketResult = await localPool.query(basicTicketQuery, [ticketId]);
      
      if (ticketResult.rowCount === 0) {
        throw new Error('Ticket not found');
      }

      const ticket = ticketResult.rows[0];
      const serialNumber = ticket.serialnumber;
      
      // Check if this serial number belongs to a printer
      const printerQuery = `
        SELECT 
          i.serialnumber as equipment_id,
          e.ipadresse as equipment_ip,
          e.idequipement,
          p.nomparc as location,
          d.nomdep as department,
          'Printer' as equipment_type
        FROM imprimante i
        JOIN equipement e ON i.idequipement = e.idequipement
        JOIN parc p ON e.idparc = p.idparc
        JOIN departement d ON p.iddep = d.iddep
        WHERE i.serialnumber = $1
      `;
      
      // Check if this serial number belongs to a PDA
      const pdaQuery = `
        SELECT 
          pda.serialnumber as equipment_id,
          e.ipadresse as equipment_ip,
          e.idequipement,
          p.nomparc as location,
          d.nomdep as department,
          'PDA' as equipment_type
        FROM pda
        JOIN equipement e ON pda.id = e.idequipement
        JOIN parc p ON e.idparc = p.idparc
        JOIN departement d ON p.iddep = d.iddep
        WHERE pda.serialnumber = $1
      `;
      
      // Check both equipment types
      const [printerResult, pdaResult] = await Promise.all([
        localPool.query(printerQuery, [serialNumber]),
        localPool.query(pdaQuery, [serialNumber])
      ]);
      
      // Determine which type of equipment this is
      let equipmentDetails;
      let equipmentType;
      
      if (printerResult.rowCount > 0) {
        equipmentDetails = printerResult.rows[0];
        equipmentType = 'Printer';
      } else if (pdaResult.rowCount > 0) {
        equipmentDetails = pdaResult.rows[0];
        equipmentType = 'PDA';
      } else {
        // If equipment not found, still return the ticket but with minimal equipment info
        equipmentDetails = {
          equipment_id: serialNumber,
          equipment_ip: 'Unknown',
          location: 'Unknown',
          department: 'Unknown',
          equipment_type: 'Unknown'
        };
      }
      
      // Format data to match frontend expectations
      return {
        id: ticket.idticket,
        subject: ticket.sujet,
        equipmentId: equipmentDetails.equipment_id,
        equipmentIp: equipmentDetails.equipment_ip || 'Unknown',
        location: equipmentDetails.location && equipmentDetails.department ? 
                 `${equipmentDetails.location} - ${equipmentDetails.department}` : 'Unknown',
        status: ticket.statut,
        priority: ticket.priority,
        createdDate: ticket.created_at,
        description: ticket.description || '',
        partsToReplace: ticket.piecesaremplacer || '',
        notes: ticket.notes || '',
        equipmentType: equipmentType || 'Unknown',
        agent: {
          name: `${ticket.agent_firstname} ${ticket.agent_lastname}`,
          email: ticket.agent_email
        },
        requester: {
          name: `${ticket.requester_firstname} ${ticket.requester_lastname}`,
          email: ticket.requester_email
        }
      };
    } catch (error) {
      console.error('Error fetching ticket:', error);
      throw error;
    }
  }

  /**
   * Close a ticket by setting its status to 'Resolu' in both databases
   * @param {number} ticketId ID of the ticket to close
   * @returns {Promise<Object>} updated ticket
   */
  async closeTicket(ticketId) {
    console.log('Attempting to close ticket in repository:', {
      ticketId: ticketId
    });

    try {
      // First get the ticket details from local database to get user emails
      const localTicketQuery = `
        SELECT t.*, 
               agent_user.email as agent_email,
               requester_user.email as requester_email
        FROM ticket t
        JOIN users agent_user ON t.agent = agent_user.id
        JOIN users requester_user ON t.requester = requester_user.id
        WHERE t.idticket = $1
      `;

      const localTicketResult = await localPool.query(localTicketQuery, [ticketId]);
      
      if (localTicketResult.rowCount === 0) {
        throw new Error('Ticket not found in local database');
      }

      const ticket = localTicketResult.rows[0];
      const agentEmail = ticket.agent_email;
      const requesterEmail = ticket.requester_email;

      // Get cloud user IDs using emails
      const [cloudAgentResult, cloudRequesterResult] = await Promise.all([
        cloudPool.query('SELECT id FROM users WHERE email = $1', [agentEmail]),
        cloudPool.query('SELECT id FROM users WHERE email = $1', [requesterEmail])
      ]);

      if (cloudAgentResult.rowCount === 0) {
        throw new Error(`Agent with email ${agentEmail} not found in cloud database`);
      }
      if (cloudRequesterResult.rowCount === 0) {
        throw new Error(`Requester with email ${requesterEmail} not found in cloud database`);
      }

      const cloudAgentId = cloudAgentResult.rows[0].id;
      const cloudRequesterId = cloudRequesterResult.rows[0].id;

      // Get cloud ticket ID using user IDs and other matching fields
      // More flexible matching without exact timestamp
      const cloudTicketQuery = `
        SELECT idticket 
        FROM ticket 
        WHERE agent = $1 
        AND requester = $2 
        AND serialnumber = $3 
        AND sujet = $4
        AND statut = 'Ouvert'
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const cloudTicketResult = await cloudPool.query(cloudTicketQuery, [
        cloudAgentId,
        cloudRequesterId,
        ticket.serialnumber,
        ticket.sujet
      ]);

      if (cloudTicketResult.rowCount === 0) {
        // Try a more relaxed matching if the first attempt fails
        const relaxedCloudTicketQuery = `
          SELECT idticket 
          FROM ticket 
          WHERE agent = $1 
          AND requester = $2 
          AND serialnumber = $3 
          AND statut = 'Ouvert'
          ORDER BY created_at DESC
          LIMIT 1
        `;

        const relaxedCloudTicketResult = await cloudPool.query(relaxedCloudTicketQuery, [
          cloudAgentId,
          cloudRequesterId,
          ticket.serialnumber
        ]);

        if (relaxedCloudTicketResult.rowCount === 0) {
          throw new Error('Matching ticket not found in cloud database');
        }

        console.log('Found matching ticket using relaxed criteria');
        const cloudTicketId = relaxedCloudTicketResult.rows[0].idticket;

        // Update both databases
        const updateQuery = `
          UPDATE ticket 
          SET statut = 'Resolu'
          WHERE idticket = $1
          RETURNING *
        `;

        console.log('Executing close ticket queries with IDs:', {
          local: ticketId,
          cloud: cloudTicketId
        });
        
        const [localResult, cloudResult] = await Promise.all([
          localPool.query(updateQuery, [ticketId]),
          cloudPool.query(updateQuery, [cloudTicketId])
        ]);
        
        console.log('Close ticket query results:', {
          local: {
            rowCount: localResult.rowCount,
            rows: localResult.rows
          },
          cloud: {
            rowCount: cloudResult.rowCount,
            rows: cloudResult.rows
          }
        });
        
        if (localResult.rowCount === 0) {
          throw new Error('Failed to update ticket in local database');
        }

        return localResult.rows[0];
      }

      const cloudTicketId = cloudTicketResult.rows[0].idticket;

      // Update both databases
      const updateQuery = `
        UPDATE ticket 
        SET statut = 'Resolu'
        WHERE idticket = $1
        RETURNING *
      `;

      console.log('Executing close ticket queries with IDs:', {
        local: ticketId,
        cloud: cloudTicketId
      });
      
      const [localResult, cloudResult] = await Promise.all([
        localPool.query(updateQuery, [ticketId]),
        cloudPool.query(updateQuery, [cloudTicketId])
      ]);
      
      console.log('Close ticket query results:', {
        local: {
          rowCount: localResult.rowCount,
          rows: localResult.rows
        },
        cloud: {
          rowCount: cloudResult.rowCount,
          rows: cloudResult.rows
        }
      });
      
      if (localResult.rowCount === 0) {
        throw new Error('Failed to update ticket in local database');
      }

      return localResult.rows[0];
    } catch (error) {
      console.error('Detailed error closing ticket:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        table: error.table,
        constraint: error.constraint,
        ticketId: ticketId
      });
      throw error;
    }
  }

  /**
   * Delete a ticket from both databases
   * @param {number} ticketId ID of the ticket to delete
   * @returns {Promise<boolean>} True if ticket was deleted
   */
  async deleteTicket(ticketId) {
    console.log('Attempting to delete ticket in repository:', {
      ticketId: ticketId
    });

    try {
      // First get the ticket details from local database to get user emails
      const localTicketQuery = `
        SELECT t.*, 
               agent_user.email as agent_email,
               requester_user.email as requester_email
        FROM ticket t
        JOIN users agent_user ON t.agent = agent_user.id
        JOIN users requester_user ON t.requester = requester_user.id
        WHERE t.idticket = $1
      `;

      const localTicketResult = await localPool.query(localTicketQuery, [ticketId]);
      
      if (localTicketResult.rowCount === 0) {
        throw new Error('Ticket not found in local database');
      }

      const ticket = localTicketResult.rows[0];
      const agentEmail = ticket.agent_email;
      const requesterEmail = ticket.requester_email;

      // Get cloud user IDs using emails
      const [cloudAgentResult, cloudRequesterResult] = await Promise.all([
        cloudPool.query('SELECT id FROM users WHERE email = $1', [agentEmail]),
        cloudPool.query('SELECT id FROM users WHERE email = $1', [requesterEmail])
      ]);

      if (cloudAgentResult.rowCount === 0) {
        throw new Error(`Agent with email ${agentEmail} not found in cloud database`);
      }
      if (cloudRequesterResult.rowCount === 0) {
        throw new Error(`Requester with email ${requesterEmail} not found in cloud database`);
      }

      const cloudAgentId = cloudAgentResult.rows[0].id;
      const cloudRequesterId = cloudRequesterResult.rows[0].id;

      // Get cloud ticket ID using user IDs and other matching fields
      const cloudTicketQuery = `
        SELECT idticket 
        FROM ticket 
        WHERE agent = $1 
        AND requester = $2 
        AND serialnumber = $3 
        AND sujet = $4
        AND statut = $5
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const cloudTicketResult = await cloudPool.query(cloudTicketQuery, [
        cloudAgentId,
        cloudRequesterId,
        ticket.serialnumber,
        ticket.sujet,
        ticket.statut
      ]);

      if (cloudTicketResult.rowCount === 0) {
        // Try a more relaxed matching if the first attempt fails
        const relaxedCloudTicketQuery = `
          SELECT idticket 
          FROM ticket 
          WHERE agent = $1 
          AND requester = $2 
          AND serialnumber = $3 
          AND statut = $4
          ORDER BY created_at DESC
          LIMIT 1
        `;

        const relaxedCloudTicketResult = await cloudPool.query(relaxedCloudTicketQuery, [
          cloudAgentId,
          cloudRequesterId,
          ticket.serialnumber,
          ticket.statut
        ]);

        if (relaxedCloudTicketResult.rowCount === 0) {
          throw new Error('Matching ticket not found in cloud database');
        }

        console.log('Found matching ticket using relaxed criteria');
        const cloudTicketId = relaxedCloudTicketResult.rows[0].idticket;

        // Delete from both databases
        const deleteQuery = `
          DELETE FROM ticket
          WHERE idticket = $1
          RETURNING *
        `;

        console.log('Executing delete ticket queries with IDs:', {
          local: ticketId,
          cloud: cloudTicketId
        });
        
        const [localResult, cloudResult] = await Promise.all([
          localPool.query(deleteQuery, [ticketId]),
          cloudPool.query(deleteQuery, [cloudTicketId])
        ]);
        
        console.log('Delete ticket query results:', {
          local: {
            rowCount: localResult.rowCount,
            rows: localResult.rows
          },
          cloud: {
            rowCount: cloudResult.rowCount,
            rows: cloudResult.rows
          }
        });
        
        if (localResult.rowCount === 0) {
          throw new Error('Failed to delete ticket from local database');
        }

        return true;
      }

      const cloudTicketId = cloudTicketResult.rows[0].idticket;

      // Delete from both databases
      const deleteQuery = `
        DELETE FROM ticket
        WHERE idticket = $1
        RETURNING *
      `;

      console.log('Executing delete ticket queries with IDs:', {
        local: ticketId,
        cloud: cloudTicketId
      });
      
      const [localResult, cloudResult] = await Promise.all([
        localPool.query(deleteQuery, [ticketId]),
        cloudPool.query(deleteQuery, [cloudTicketId])
      ]);
      
      console.log('Delete ticket query results:', {
        local: {
          rowCount: localResult.rowCount,
          rows: localResult.rows
        },
        cloud: {
          rowCount: cloudResult.rowCount,
          rows: cloudResult.rows
        }
      });
      
      if (localResult.rowCount === 0) {
        throw new Error('Failed to delete ticket from local database');
      }

      return true;
    } catch (error) {
      console.error('Detailed error deleting ticket:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        table: error.table,
        constraint: error.constraint,
        ticketId: ticketId
      });
      throw error;
    }
  }

  /**
   * Update ticket notes in both local and cloud databases
   * @param {number} ticketId ID of the ticket to update
   * @param {string} notes New notes content
   * @returns {Promise<Object>} updated ticket
   */
  async updateTicketNotes(ticketId, notes) {
    console.log('Updating ticket notes:', { ticketId, notes });

    try {
      // First get the ticket details from local database to get user emails
      const localTicketQuery = `
        SELECT t.*, 
               agent_user.email as agent_email,
               requester_user.email as requester_email
        FROM ticket t
        JOIN users agent_user ON t.agent = agent_user.id
        JOIN users requester_user ON t.requester = requester_user.id
        WHERE t.idticket = $1
      `;

      const localTicketResult = await localPool.query(localTicketQuery, [ticketId]);
      
      if (localTicketResult.rowCount === 0) {
        throw new Error('Ticket not found in local database');
      }

      const ticket = localTicketResult.rows[0];
      const agentEmail = ticket.agent_email;
      const requesterEmail = ticket.requester_email;

      // Get cloud user IDs using emails
      const [cloudAgentResult, cloudRequesterResult] = await Promise.all([
        cloudPool.query('SELECT id FROM users WHERE email = $1', [agentEmail]),
        cloudPool.query('SELECT id FROM users WHERE email = $1', [requesterEmail])
      ]);

      if (cloudAgentResult.rowCount === 0) {
        throw new Error(`Agent with email ${agentEmail} not found in cloud database`);
      }
      if (cloudRequesterResult.rowCount === 0) {
        throw new Error(`Requester with email ${requesterEmail} not found in cloud database`);
      }

      const cloudAgentId = cloudAgentResult.rows[0].id;
      const cloudRequesterId = cloudRequesterResult.rows[0].id;

      // Get cloud ticket ID using user IDs and other matching fields
      const cloudTicketQuery = `
        SELECT idticket 
        FROM ticket 
        WHERE agent = $1 
        AND requester = $2 
        AND serialnumber = $3 
        AND sujet = $4
        AND statut = $5
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const cloudTicketResult = await cloudPool.query(cloudTicketQuery, [
        cloudAgentId,
        cloudRequesterId,
        ticket.serialnumber,
        ticket.sujet,
        ticket.statut
      ]);

      if (cloudTicketResult.rowCount === 0) {
        throw new Error('Matching ticket not found in cloud database');
      }

      const cloudTicketId = cloudTicketResult.rows[0].idticket;

      // Update notes in both databases
      const updateQuery = `
        UPDATE ticket 
        SET notes = $1
        WHERE idticket = $2
        RETURNING *
      `;

      console.log('Executing update notes queries with IDs:', {
        local: ticketId,
        cloud: cloudTicketId
      });
      
      const [localResult, cloudResult] = await Promise.all([
        localPool.query(updateQuery, [notes, ticketId]),
        cloudPool.query(updateQuery, [notes, cloudTicketId])
      ]);
      
      console.log('Update notes query results:', {
        local: {
          rowCount: localResult.rowCount,
          rows: localResult.rows
        },
        cloud: {
          rowCount: cloudResult.rowCount,
          rows: cloudResult.rows
        }
      });
      
      if (localResult.rowCount === 0) {
        throw new Error('Failed to update ticket notes in local database');
      }

      return localResult.rows[0];
    } catch (error) {
      console.error('Detailed error updating ticket notes:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        table: error.table,
        constraint: error.constraint,
        ticketId: ticketId
      });
      throw error;
    }
  }
}

module.exports = new TicketRepository(); 