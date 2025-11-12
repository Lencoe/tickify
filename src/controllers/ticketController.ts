import { Request, Response } from 'express';
import { TicketTypeModel } from '../models/TicketType';

// ✅ Create a new ticket type (Merchant only)
export const createTicketType = async (req: Request, res: Response) => {
  try {
    const { event_id, name, price_cents, total_quantity, sales_start, sales_end } = req.body;

    if (!event_id || !name || !price_cents || !total_quantity) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newTicket = await TicketTypeModel.create({
      event_id,
      name,
      price_cents,
      total_quantity,
      available_quantity: total_quantity, // by default all tickets are available
      sales_start,
      sales_end,
    });

    return res.status(201).json({ message: 'Ticket type created successfully', ticket: newTicket });
  } catch (err) {
    console.error('❌ Error creating ticket:', err);
    return res.status(500).json({ message: 'Failed to create ticket type' });
  }
};

// ✅ Get all ticket types for a specific event (Public)
export const getTicketsByEvent = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const tickets = await TicketTypeModel.findByEvent(eventId);

    if (!tickets || tickets.length === 0) {
      return res.status(404).json({ message: 'No tickets found for this event' });
    }

    return res.status(200).json({ tickets });
  } catch (err) {
    console.error('❌ Error fetching tickets:', err);
    return res.status(500).json({ message: 'Failed to fetch tickets' });
  }
};

// ✅ Update ticket details (Merchant only)
export const updateTicketType = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const updates = req.body;

    const updatedTicket = await TicketTypeModel.update(ticketId, updates);

    if (!updatedTicket) {
      return res.status(404).json({ message: 'Ticket not found or update failed' });
    }

    return res.status(200).json({ message: 'Ticket updated successfully', ticket: updatedTicket });
  } catch (err: any) {
    console.error('❌ Error updating ticket:', err);
    
    // Check if it's an unknown field error from the model
    if (err.message && err.message.includes('Unknown fields')) {
      return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({ message: 'Failed to update ticket type' });
  }
};

// ✅ Delete a ticket type (Merchant only)
export const deleteTicketType = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;

    const deletedTicket = await TicketTypeModel.delete(ticketId);

    if (!deletedTicket) {
      return res.status(404).json({ message: 'Ticket not found or already deleted' });
    }

    return res.status(200).json({ message: 'Ticket deleted successfully', ticket: deletedTicket });
  } catch (err) {
    console.error('❌ Error deleting ticket:', err);
    return res.status(500).json({ message: 'Failed to delete ticket type' });
  }
};
