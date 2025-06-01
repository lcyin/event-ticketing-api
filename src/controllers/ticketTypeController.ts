import { Request, Response } from "express";
import { getDataSource } from "../config/getDataSource";
import { TicketType } from "../entities/TicketType";
import { Event } from "../entities/Event";

const ticketTypeRepository = getDataSource().getRepository(TicketType);
const eventRepository = getDataSource().getRepository(Event);

export const ticketTypeController = {
  // Get all ticket types for an event
  async getTicketTypesByEvent(req: Request, res: Response) {
    try {
      const ticketTypes = await ticketTypeRepository.find({
        where: { event: { id: req.params.eventId } },
      });
      res.json(ticketTypes);
    } catch (error) {
      res.status(500).json({ message: "Error fetching ticket types", error });
    }
  },

  // Get ticket type by ID
  async getTicketTypeById(req: Request, res: Response) {
    try {
      const ticketType = await ticketTypeRepository.findOne({
        where: { id: req.params.id },
        relations: ["event"],
      });

      if (!ticketType) {
        return res.status(404).json({ message: "Ticket type not found" });
      }

      res.json(ticketType);
    } catch (error) {
      res.status(500).json({ message: "Error fetching ticket type", error });
    }
  },

  // Create new ticket type
  async createTicketType(req: Request, res: Response) {
    try {
      const event = await eventRepository.findOne({
        where: { id: req.params.eventId },
      });

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      const ticketType = ticketTypeRepository.create({
        ...req.body,
        event,
      });

      const result = await ticketTypeRepository.save(ticketType);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: "Error creating ticket type", error });
    }
  },

  // Update ticket type
  async updateTicketType(req: Request, res: Response) {
    try {
      const ticketType = await ticketTypeRepository.findOne({
        where: { id: req.params.id },
        relations: ["event"],
      });

      if (!ticketType) {
        return res.status(404).json({ message: "Ticket type not found" });
      }

      ticketTypeRepository.merge(ticketType, req.body);
      const result = await ticketTypeRepository.save(ticketType);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Error updating ticket type", error });
    }
  },

  // Delete ticket type
  async deleteTicketType(req: Request, res: Response) {
    try {
      const ticketType = await ticketTypeRepository.findOne({
        where: { id: req.params.id },
      });

      if (!ticketType) {
        return res.status(404).json({ message: "Ticket type not found" });
      }

      await ticketTypeRepository.remove(ticketType);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting ticket type", error });
    }
  },
};
