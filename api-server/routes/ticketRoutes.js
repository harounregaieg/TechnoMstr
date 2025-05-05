const express = require('express');
const router = express.Router();
const ticketRepository = require('../models/ticketRepository');
const { localPool } = require('../config/db');
const notificationController = require('../controllers/notificationController');

// Create a new ticket
router.post('/', async (req, res) => {
  console.log('Received ticket creation request:', {
    body: req.body,
    headers: req.headers
  });

  try {
    // Log the exact values we're interested in
    console.log('Checking specific fields:', {
      piecesaremplacer: req.body.piecesaremplacer,
      description: req.body.description
    });

    const ticket = await ticketRepository.createTicket(req.body);
    console.log('Successfully created ticket:', ticket);
    
    // Log the created ticket's fields
    console.log('Created ticket fields:', {
      piecesaremplacer: ticket.piecesaremplacer,
      description: ticket.description
    });

    // Create notification for the new ticket
    try {
      await notificationController.createNotification(
        'success',
        'ticket',
        `Nouveau ticket créé: ${ticket.sujet || 'Sans titre'}`,
        ticket.idticket,
        null // null means for all users
      );

      // Create notification specifically for the assigned agent
      if (ticket.agent) {
        await notificationController.createNotification(
          'info',
          'ticket',
          `Un nouveau ticket vous a été assigné: ${ticket.sujet || 'Sans titre'}`,
          ticket.idticket,
          ticket.agent
        );
      }
    } catch (notifError) {
      console.error('Error creating ticket notification:', notifError);
      // Don't fail the request if notification creation fails
    }

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error in create ticket route:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body
    });
    res.status(500).json({ 
      error: error.message || 'Failed to create ticket',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Close a ticket
router.put('/:id/close', async (req, res) => {
  console.log('Received close ticket request:', {
    ticketId: req.params.id
  });

  try {
    // Get ticket details before closing
    const ticketDetailsBefore = await ticketRepository.getTicketById(req.params.id);
    
    const ticket = await ticketRepository.closeTicket(req.params.id);
    console.log('Successfully closed ticket:', ticket);
    
    // Create notification for closed ticket
    try {
      await notificationController.createNotification(
        'success',
        'ticket',
        `Ticket résolu: ${ticket.sujet || ticketDetailsBefore.subject || 'Sans titre'}`,
        ticket.idticket,
        null // null means for all users
      );
    } catch (notifError) {
      console.error('Error creating ticket close notification:', notifError);
    }
    
    res.json(ticket);
  } catch (error) {
    console.error('Error in close ticket route:', {
      message: error.message,
      stack: error.stack,
      ticketId: req.params.id
    });
    
    if (error.message === 'Ticket not found') {
      res.status(404).json({ error: 'Ticket not found' });
    } else {
      res.status(500).json({ 
        error: error.message || 'Failed to close ticket',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

// Delete a ticket
router.delete('/:id', async (req, res) => {
  console.log('Received delete ticket request:', {
    ticketId: req.params.id
  });

  try {
    // Get ticket details before deletion
    const ticketDetailsBefore = await ticketRepository.getTicketById(req.params.id);
    
    await ticketRepository.deleteTicket(req.params.id);
    console.log('Successfully deleted ticket:', req.params.id);
    
    // Create notification for deleted ticket
    try {
      await notificationController.createNotification(
        'warning',
        'ticket',
        `Ticket supprimé: ${ticketDetailsBefore.subject || 'Sans titre'}`,
        req.params.id,
        null // null means for all users
      );
    } catch (notifError) {
      console.error('Error creating ticket delete notification:', notifError);
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error in delete ticket route:', {
      message: error.message,
      stack: error.stack,
      ticketId: req.params.id
    });
    
    if (error.message === 'Ticket not found') {
      res.status(404).json({ error: 'Ticket not found' });
    } else {
      res.status(500).json({ 
        error: error.message || 'Failed to delete ticket',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

// Get a single ticket by ID
router.get('/:id', async (req, res) => {
  console.log('Received get ticket request:', {
    ticketId: req.params.id
  });

  try {
    const ticket = await ticketRepository.getTicketById(req.params.id);
    console.log('Successfully retrieved ticket:', ticket);
    res.json(ticket);
  } catch (error) {
    console.error('Error in get ticket route:', {
      message: error.message,
      stack: error.stack,
      ticketId: req.params.id
    });
    
    if (error.message === 'Ticket not found') {
      res.status(404).json({ error: 'Ticket not found' });
    } else {
      res.status(500).json({ 
        error: error.message || 'Failed to get ticket',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

// Get tickets for a user
router.get('/user/:userId', async (req, res) => {
  console.log('Received get tickets request:', {
    userId: req.params.userId,
    role: req.query.role
  });

  try {
    const { userId } = req.params;
    const { role = 'agent' } = req.query;
    const tickets = await ticketRepository.getTicketsForUser(userId, role);
    console.log(`Found ${tickets.length} tickets for user ${userId}`);
    res.json(tickets);
  } catch (error) {
    console.error('Error in get tickets route:', {
      message: error.message,
      stack: error.stack,
      userId: req.params.userId,
      role: req.query.role
    });
    res.status(500).json({ 
      error: error.message || 'Failed to get tickets',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get recent ticket activities (creation and resolution)
router.get('/activities/recent', async (req, res) => {
  console.log('Received request for recent ticket activities');
  
  try {
    const limit = req.query.limit || 5; // Default to 5 activities
    
    const query = `
      WITH ticket_data AS (
        SELECT
          t.idticket,
          t.sujet,
          t.serialnumber,
          t.created_at,
          t.statut,
          t.agent,
          t.requester,
          req.prenom as requester_firstname,
          req.nom as requester_lastname,
          ag.prenom as agent_firstname,
          ag.nom as agent_lastname
        FROM ticket t
        JOIN users req ON t.requester = req.id
        JOIN users ag ON t.agent = ag.id
      )
      
      (SELECT
        idticket,
        sujet,
        serialnumber,
        created_at AS activity_time,
        'created' AS activity_type,
        CONCAT(requester_firstname, ' ', requester_lastname) AS user_name,
        CONCAT('New ticket #', idticket, ' created: ', sujet) AS message
      FROM ticket_data)
      
      UNION ALL
      
      (SELECT
        idticket,
        sujet,
        serialnumber,
        created_at AS activity_time, 
        'resolved' AS activity_type,
        CONCAT(agent_firstname, ' ', agent_lastname) AS user_name,
        CONCAT('Ticket #', idticket, ' resolved: ', sujet) AS message
      FROM ticket_data
      WHERE statut = 'Resolu')
      
      ORDER BY activity_time DESC
      LIMIT $1
    `;
    
    const result = await localPool.query(query, [limit]);
    console.log(`Found ${result.rowCount} recent ticket activities`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recent activities',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update ticket notes
router.put('/:id/notes', async (req, res) => {
  console.log('Received update notes request:', {
    ticketId: req.params.id,
    notes: req.body.notes
  });

  try {
    // Get ticket details before update
    const ticketDetailsBefore = await ticketRepository.getTicketById(req.params.id);
    
    const ticket = await ticketRepository.updateTicketNotes(req.params.id, req.body.notes);
    console.log('Successfully updated ticket notes:', ticket);
    
    // Create notification for updated ticket notes
    try {
      await notificationController.createNotification(
        'info',
        'ticket',
        `Notes mises à jour sur le ticket: ${ticket.sujet || ticketDetailsBefore.subject || 'Sans titre'}`,
        ticket.idticket,
        null
      );
    } catch (notifError) {
      console.error('Error creating ticket notes update notification:', notifError);
    }
    
    res.json(ticket);
  } catch (error) {
    console.error('Error in update notes route:', {
      message: error.message,
      stack: error.stack,
      ticketId: req.params.id
    });
    
    if (error.message === 'Ticket not found') {
      res.status(404).json({ error: 'Ticket not found' });
    } else {
      res.status(500).json({ 
        error: error.message || 'Failed to update ticket notes',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

module.exports = router; 