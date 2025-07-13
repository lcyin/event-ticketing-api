import { Request, Response } from "express";
import { getDataSource } from "../config/getDataSource";
import { Event } from "../entities/Event";
import { validate as isValidUUID } from "uuid";
import { createEventDB, updateEventDB } from "../services/eventService";
import { createTicketTypeDB } from "../services/ticketTypeService";
import { validateCreateEventData } from "../helpers/validate-create-event-data.helper";
import { validateCreateTicketTypeData } from "../helpers/validate-create-ticket-type-data.helper";
import { validateUpdateEventData } from "../helpers/validate-update-event-data.helper";

export const createEvent = async (req: Request, res: Response) => {
  const eventData = validateCreateEventData(req.body);

  try {
    const savedEvent = await createEventDB(getDataSource(), eventData);

    return res.status(201).json({
      id: savedEvent.id,
      title: savedEvent.title,
      description: savedEvent.description,
      long_description: savedEvent.longDescription,
      date: savedEvent.date,
      start_time: savedEvent.startTime,
      end_time: savedEvent.endTime,
      venue: savedEvent.venue,
      location: savedEvent.location,
      address: savedEvent.address,
      organizer: savedEvent.organizer,
      image_url: savedEvent.imageUrl,
      price_range: savedEvent.priceRange,
      categories: savedEvent.categories,
      status: savedEvent.status,
      created_at: savedEvent.createdAt.toISOString(),
      updated_at: savedEvent.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error creating event:", error);
    // Check for specific database errors if needed, e.g., unique constraint violations
    // if (error.code === '23505') { // Example for PostgreSQL unique violation
    //   return res.status(409).json({ message: "Event with this title/date already exists." });
    // }
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createTicketTypeForEvent = async (req: Request, res: Response) => {
  const { eventId } = req.params;

  if (!isValidUUID(eventId)) {
    return res.status(400).json({ message: "Invalid event ID format." });
  }

  try {
    const ticketTypeData = validateCreateTicketTypeData(req.body);
    const savedTicketType = await createTicketTypeDB(
      getDataSource(),
      eventId,
      ticketTypeData
    );

    return res.status(201).json({
      ...savedTicketType,
      eventId: savedTicketType.eventId,
      createdAt: savedTicketType.createdAt.toISOString(),
      updatedAt: savedTicketType.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error("Error creating ticket type for event:", error);
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(400).json({ message: error.message });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id;

    if (!isValidUUID(eventId)) {
      return res.status(400).json({ message: "Invalid event ID format." });
    }

    const eventRepository = getDataSource().getRepository(Event);
    const event = await eventRepository.findOneBy({ id: eventId });

    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    return res.status(200).json({
      id: event.id,
      title: event.title,
      description: event.description,
      long_description: event.longDescription,
      date: event.date,
      start_time: event.startTime,
      end_time: event.endTime,
      venue: event.venue,
      location: event.location,
      address: event.address,
      organizer: event.organizer,
      image_url: event.imageUrl,
      price_range: event.priceRange,
      categories: event.categories,
      status: event.status,
      created_at: event.createdAt.toISOString(),
      updated_at: event.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching event by ID for admin:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const eventRepository = getDataSource().getRepository(Event);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const statusFilter = req.query.status as string;
    const sortBy = (req.query.sort_by as string) || "createdAt"; // Default sort
    const order =
      (req.query.order as string)?.toUpperCase() === "ASC" ? "ASC" : "DESC"; // Default DESC

    const offset = (page - 1) * limit;

    const queryBuilder = eventRepository.createQueryBuilder("event");

    if (statusFilter) {
      queryBuilder.where("event.status = :status", { status: statusFilter });
    }

    // Validate sortBy to prevent SQL injection if directly using user input
    // For simple cases, a whitelist is good. For complex, consider mapping.
    const allowedSortFields = [
      "id",
      "title",
      "date",
      "location",
      "status",
      "createdAt",
      "updatedAt",
    ];
    if (allowedSortFields.includes(sortBy)) {
      queryBuilder.orderBy(`event.${sortBy}`, order);
    } else {
      queryBuilder.orderBy(`event.createdAt`, "DESC"); // Default sort if invalid field
    }

    const [events, totalEvents] = await queryBuilder
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    const formattedEvents = events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description, // Keep it brief for list view
      date: event.date,
      location: event.location,
      status: event.status,
      created_at: event.createdAt.toISOString(),
      updated_at: event.updatedAt.toISOString(),
    }));

    return res.status(200).json({
      total_events: totalEvents,
      page,
      limit,
      events: formattedEvents,
    });
  } catch (error) {
    console.error("Error fetching events for admin:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id;

    if (!isValidUUID(eventId)) {
      return res.status(400).json({ message: "Invalid event ID format." });
    }

    const eventRepository = getDataSource().getRepository(Event);
    const event = await eventRepository.findOneBy({ id: eventId });

    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Note: For HTTP 409 Conflict, you would add checks here.
    // For example, check if there are active orders or non-cascade-deleted tickets.
    // const orderRepository = getDataSource().getRepository(Order);
    // const activeOrders = await orderRepository.count({ where: { eventId: eventId, status: 'active' } }); // Fictional field eventId on Order
    // if (activeOrders > 0) {
    //   return res.status(409).json({ message: "Cannot delete event with active orders." });
    // }

    await eventRepository.remove(event);
    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting event for admin:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateEventDetails = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    return res.status(400).json({ message: "Invalid event ID format." });
  }

  try {
    const updates = validateUpdateEventData(req.body);
    const updatedEvent = await updateEventDB(getDataSource(), id, updates);

    return res.status(200).json({
      id: updatedEvent.id,
      title: updatedEvent.title,
      description: updatedEvent.description,
      long_description: updatedEvent.longDescription,
      date: updatedEvent.date,
      start_time: updatedEvent.startTime,
      end_time: updatedEvent.endTime,
      venue: updatedEvent.venue,
      location: updatedEvent.location,
      address: updatedEvent.address,
      organizer: updatedEvent.organizer,
      image_url: updatedEvent.imageUrl,
      price_range: updatedEvent.priceRange,
      categories: updatedEvent.categories,
      status: updatedEvent.status,
      created_at: updatedEvent.createdAt.toISOString(),
      updated_at: updatedEvent.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error("Error updating event details for admin:", error);
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(400).json({ message: error.message });
  }
};
