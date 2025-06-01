import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Event } from '../entities/Event';

const eventRepository = AppDataSource.getRepository(Event);

export const eventController = {
  // Get all events
  async getAllEvents(req: Request, res: Response) {
    try {
      const events = await eventRepository.find({
        relations: ['ticketTypes', 'faqs'],
      });
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching events', error });
    }
  },

  // Get event by ID
  async getEventById(req: Request, res: Response) {
    try {
      const event = await eventRepository.findOne({
        where: { id: req.params.id },
        relations: ['ticketTypes', 'faqs'],
      });

      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      res.json(event);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching event', error });
    }
  },

  // Create new event
  async createEvent(req: Request, res: Response) {
    try {
      const event = eventRepository.create(req.body);
      const result = await eventRepository.save(event);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: 'Error creating event', error });
    }
  },

  // Update event
  async updateEvent(req: Request, res: Response) {
    try {
      const event = await eventRepository.findOne({
        where: { id: req.params.id },
      });

      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      eventRepository.merge(event, req.body);
      const result = await eventRepository.save(event);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Error updating event', error });
    }
  },

  // Delete event
  async deleteEvent(req: Request, res: Response) {
    try {
      const event = await eventRepository.findOne({
        where: { id: req.params.id },
      });

      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      await eventRepository.remove(event);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting event', error });
    }
  },
}; 