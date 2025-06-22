import { Request, Response } from "express";
import { Brackets } from "typeorm";
import { getDataSource } from "../config/getDataSource";
import { Event } from "../entities/Event";
import { validate as isValidUUID } from "uuid";

const formatDateToISO = (
  dateStr: string,
  timeStr: string | null
): string | null => {
  if (!dateStr || !timeStr) {
    return null;
  }
  try {
    // Assuming timeStr from DB (TIME WITH TIME ZONE) can be combined with dateStr
    // e.g., dateStr = "2023-10-26", timeStr = "14:30:00+02"
    const d = new Date(`${dateStr}T${timeStr}`);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch (e) {
    console.error("Error formatting date-time to ISO:", e);
    return null;
  }
};

export const getPublicEvents = async (req: Request, res: Response) => {
  try {
    const { q, category, date } = req.query;

    let page = parseInt(req.query.page as string) || 1;
    let limit = parseInt(req.query.limit as string) || 20;

    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100; // Max limit

    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date as string)) {
      return res
        .status(400)
        .json({ message: "Invalid date format. Use YYYY-MM-DD." });
    }

    const eventRepository = getDataSource().getRepository(Event);
    const queryBuilder = eventRepository.createQueryBuilder("event");

    // Select specific fields for public response
    queryBuilder.select([
      "event.id",
      "event.title",
      "event.imageUrl",
      "event.categories",
      "event.date", // Needed for constructing full startTime/endTime
      "event.startTime",
      "event.endTime",
      "event.venue",
      "event.location",
    ]);

    if (q && typeof q === "string") {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where("event.title ILIKE :searchTerm", {
            searchTerm: `%${q}%`,
          }).orWhere("event.description ILIKE :searchTerm", {
            searchTerm: `%${q}%`,
          });
        })
      );
    }

    if (category && typeof category === "string") {
      // Use array containment operator @> for checking if category exists in event.categories
      queryBuilder.andWhere("event.categories @> :categories::text[]", {
        categories: [category],
      });
    }

    if (date && typeof date === "string") {
      queryBuilder.andWhere("event.date = :date", { date });
    }

    // Default sort order
    queryBuilder
      .orderBy("event.date", "ASC")
      .addOrderBy("event.startTime", "ASC");

    const offset = (page - 1) * limit;
    const [events, totalItems] = await queryBuilder
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    const formattedEvents = events.map((event) => ({
      id: event.id,
      title: event.title,
      imageUrl: event.imageUrl,
      categories: event.categories,
      startTime: formatDateToISO(event.date, event.startTime),
      endTime: formatDateToISO(event.date, event.endTime),
      venue: event.venue,
      location: event.location,
    }));

    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
      data: formattedEvents,
    });
  } catch (error) {
    console.error("Error fetching public events:", error);
    // Check for specific database errors if needed
    // For example, if an invalid UUID is passed for a related entity in a more complex query
    // if (error.message.includes("invalid input syntax for type uuid")) {
    //   return res.status(400).json({ message: "Invalid parameter causing database error." });
    // }
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getPublicEventById = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    if (!isValidUUID(eventId)) {
      return res.status(400).json({ message: "Invalid event ID format." });
    }

    const eventRepository = getDataSource().getRepository(Event);
    const event = await eventRepository.findOne({
      where: { id: eventId },
      relations: ["ticketTypes"],
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Format the response to match the specification
    const formattedResponse = {
      id: event.id,
      title: event.title,
      description: event.description,
      longDescription: event.longDescription,
      imageUrl: event.imageUrl,
      categories: event.categories,
      startTime: formatDateToISO(event.date, event.startTime),
      endTime: formatDateToISO(event.date, event.endTime),
      venue: event.venue,
      location: event.location,
      address: event.address,
      organizer: event.organizer,
      priceRange: event.priceRange,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      ticketTypes: event.ticketTypes.map((tt) => ({
        id: tt.id,
        name: tt.name,
        price: tt.price,
        description: tt.description,
        quantity: tt.quantity,
      })),
    };

    return res.status(200).json(formattedResponse);
  } catch (error) {
    console.error("Error fetching single public event:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
