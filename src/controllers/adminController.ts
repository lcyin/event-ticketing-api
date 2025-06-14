import { Request, Response } from "express";
import { getDataSource } from "../config/getDataSource";
import { Event } from "../entities/Event";

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
