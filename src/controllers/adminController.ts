import { Request, Response } from "express";
import { getDataSource } from "../config/getDataSource";
import { Event } from "../entities/Event";
import { validate as isValidUUID } from "uuid";
import { TicketType } from "../entities/TicketType";

export const createEvent = async (req: Request, res: Response) => {
  const {
    title,
    description,
    long_description,
    date,
    start_time,
    end_time,
    venue,
    location,
    address,
    organizer,
    image_url,
    price_range,
    categories,
    status, // Added status field
  } = req.body;

  // --- Basic Validation ---
  if (!title || typeof title !== "string") {
    return res
      .status(400)
      .json({ message: "Title is required and must be a string." });
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res
      .status(400)
      .json({ message: "Date is required in YYYY-MM-DD format." });
  }
  if (start_time && !/^\d{2}:\d{2}$/.test(start_time)) {
    return res
      .status(400)
      .json({ message: "Start time must be in HH:MM format." });
  }
  if (end_time && !/^\d{2}:\d{2}$/.test(end_time)) {
    return res
      .status(400)
      .json({ message: "End time must be in HH:MM format." });
  }
  if (!venue || typeof venue !== "string") {
    return res
      .status(400)
      .json({ message: "Venue is required and must be a string." });
  }
  if (!location || typeof location !== "string") {
    return res
      .status(400)
      .json({ message: "Location is required and must be a string." });
  }
  if (!image_url || typeof image_url !== "string") {
    // Basic check, consider URL validation library
    return res
      .status(400)
      .json({ message: "Image URL is required and must be a string." });
  }
  if (!price_range || typeof price_range !== "string") {
    return res
      .status(400)
      .json({ message: "Price range is required and must be a string." });
  }
  if (
    !categories ||
    !Array.isArray(categories) ||
    categories.length === 0 ||
    !categories.every((cat) => typeof cat === "string")
  ) {
    return res.status(400).json({
      message: "Categories are required as a non-empty array of strings.",
    });
  }
  // Optional fields type checks
  if (description && typeof description !== "string") {
    return res.status(400).json({ message: "Description must be a string." });
  }
  if (long_description && typeof long_description !== "string") {
    return res
      .status(400)
      .json({ message: "Long description must be a string." });
  }
  if (address && typeof address !== "string") {
    return res.status(400).json({ message: "Address must be a string." });
  }
  if (organizer && typeof organizer !== "string") {
    return res.status(400).json({ message: "Organizer must be a string." });
  }
  // --- End Validation ---

  try {
    const eventRepository = getDataSource().getRepository(Event);

    const newEvent = eventRepository.create({
      title,
      description,
      longDescription: long_description,
      date,
      startTime: start_time,
      endTime: end_time,
      venue,
      location,
      address,
      organizer,
      imageUrl: image_url,
      priceRange: price_range,
      categories,
      status: status || "draft", // Default to 'draft' if not provided
    });

    const savedEvent = await eventRepository.save(newEvent);

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
  try {
    const { eventId } = req.params;
    const { name, price, description, quantity } = req.body;

    if (!isValidUUID(eventId)) {
      return res.status(400).json({ message: "Invalid event ID format." });
    }

    // Validate request body
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res
        .status(400)
        .json({
          message:
            "Ticket type name is required and must be a non-empty string.",
        });
    }
    if (price === undefined || typeof price !== "number" || price < 0) {
      return res
        .status(400)
        .json({
          message: "Price is required and must be a non-negative number.",
        });
    }
    if (
      quantity === undefined ||
      typeof quantity !== "number" ||
      quantity < 0
    ) {
      return res
        .status(400)
        .json({
          message: "Quantity is required and must be a non-negative number.",
        });
    }
    if (description && typeof description !== "string") {
      return res.status(400).json({ message: "Description must be a string." });
    }

    const eventRepository = getDataSource().getRepository(Event);
    const event = await eventRepository.findOneBy({ id: eventId });

    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    const ticketTypeRepository = getDataSource().getRepository(TicketType);
    const newTicketType = ticketTypeRepository.create({
      eventId,
      name,
      price,
      description,
      quantity,
      event, // Associate with the found event
    });

    const savedTicketType = await ticketTypeRepository.save(newTicketType);

    return res.status(201).json({
      ...savedTicketType,
      eventId: savedTicketType.eventId, // Ensure eventId is in the response
      createdAt: savedTicketType.createdAt.toISOString(),
      updatedAt: savedTicketType.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error creating ticket type for event:", error);
    return res.status(500).json({ message: "Internal server error" });
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
  try {
    const eventId = req.params.id;
    const updates = req.body;

    if (!isValidUUID(eventId)) {
      return res.status(400).json({ message: "Invalid event ID format." });
    }

    const eventRepository = getDataSource().getRepository(Event);
    let event = await eventRepository.findOneBy({ id: eventId });

    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // --- Validation for updatable fields ---
    if (
      updates.title !== undefined &&
      (typeof updates.title !== "string" || updates.title.trim() === "")
    ) {
      return res
        .status(400)
        .json({ message: "Title must be a non-empty string." });
    }
    if (
      updates.date !== undefined &&
      !/^\d{4}-\d{2}-\d{2}$/.test(updates.date)
    ) {
      return res
        .status(400)
        .json({ message: "Date must be in YYYY-MM-DD format." });
    }
    if (
      updates.start_time !== undefined &&
      updates.start_time !== null &&
      !/^\d{2}:\d{2}$/.test(updates.start_time)
    ) {
      return res
        .status(400)
        .json({ message: "Start time must be in HH:MM format or null." });
    }
    if (
      updates.end_time !== undefined &&
      updates.end_time !== null &&
      !/^\d{2}:\d{2}$/.test(updates.end_time)
    ) {
      return res
        .status(400)
        .json({ message: "End time must be in HH:MM format or null." });
    }
    if (
      updates.categories !== undefined &&
      (!Array.isArray(updates.categories) ||
        updates.categories.length === 0 ||
        !updates.categories.every((cat: any) => typeof cat === "string"))
    ) {
      return res
        .status(400)
        .json({ message: "Categories must be a non-empty array of strings." });
    }
    // Add more specific validations for other fields as needed
    // For example, for string fields that shouldn't be empty if provided:
    const stringFieldsToValidate: (keyof Event)[] = [
      "description",
      "longDescription",
      "venue",
      "location",
      "address",
      "organizer",
      "imageUrl",
      "priceRange",
      "status",
    ];
    for (const field of stringFieldsToValidate) {
      const snakeCaseField = field.replace(
        /[A-Z]/g,
        (letter) => `_${letter.toLowerCase()}`
      ); // Convert camelCase to snake_case for request body
      if (
        updates[snakeCaseField] !== undefined &&
        updates[snakeCaseField] !== null &&
        typeof updates[snakeCaseField] !== "string"
      ) {
        return res
          .status(400)
          .json({ message: `${field} must be a string or null.` });
      }
    }
    // --- End Validation ---

    // Map request body (snake_case) to entity properties (camelCase)
    const {
      long_description,
      start_time,
      end_time,
      image_url,
      price_range,
      ...otherUpdates
    } = updates;
    const mappedUpdates: Partial<Event> = { ...otherUpdates };
    if (long_description !== undefined)
      mappedUpdates.longDescription = long_description;
    if (start_time !== undefined) mappedUpdates.startTime = start_time;
    if (end_time !== undefined) mappedUpdates.endTime = end_time;
    if (image_url !== undefined) mappedUpdates.imageUrl = image_url;
    if (price_range !== undefined) mappedUpdates.priceRange = price_range;

    // Merge and save
    eventRepository.merge(event, mappedUpdates);
    const updatedEvent = await eventRepository.save(event);

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
  } catch (error) {
    console.error("Error updating event details for admin:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
