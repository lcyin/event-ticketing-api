import { DataSource, Brackets } from "typeorm";
import { Event } from "../entities/Event";
import { IEvent, IGetPublicEventsQuery } from "../types/event.type";
import { validate as isValidUUID } from "uuid";

const formatDateToISO = (
  dateStr: string,
  timeStr: string | null
): string | null => {
  if (!dateStr || !timeStr) {
    return null;
  }
  try {
    const d = new Date(`${dateStr}T${timeStr}`);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch (e) {
    console.error("Error formatting date-time to ISO:", e);
    return null;
  }
};

export const createEventDB = async (ds: DataSource, eventData: IEvent) => {
  const eventRepository = ds.getRepository(Event);

  const newEvent = eventRepository.create(eventData);

  const savedEvent = await eventRepository.save(newEvent);

  return savedEvent;
};

export const updateEventDB = async (
  ds: DataSource,
  eventId: string,
  updates: Partial<Event>
) => {
  const eventRepository = ds.getRepository(Event);
  const event = await eventRepository.findOneBy({ id: eventId });

  if (!event) {
    throw new Error("Event not found.");
  }

  eventRepository.merge(event, updates);
  const updatedEvent = await eventRepository.save(event);

  return updatedEvent;
};

export const getPublicEvents = async (ds: DataSource, query: IGetPublicEventsQuery) => {
  const { q, category, date } = query;

  let page = parseInt(query.page as string) || 1;
  let limit = parseInt(query.limit as string) || 20;

  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > 100) limit = 100; // Max limit

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date as string)) {
    const error = new Error("Invalid date format. Use YYYY-MM-DD.");
    (error as any).statusCode = 400;
    throw error;
  }

  const eventRepository = ds.getRepository(Event);
  const queryBuilder = eventRepository.createQueryBuilder("event");

  queryBuilder.select([
    "event.id",
    "event.title",
    "event.imageUrl",
    "event.categories",
    "event.date",
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
    queryBuilder.andWhere("event.categories @> :categories::text[]", {
      categories: [category],
    });
  }

  if (date && typeof date === "string") {
    queryBuilder.andWhere("event.date = :date", { date });
  }

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

  return {
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
    },
    data: formattedEvents,
  };
};

export const getPublicEventById = async (ds: DataSource, eventId: string) => {
  if (!isValidUUID(eventId)) {
    const error = new Error("Invalid event ID format.");
    (error as any).statusCode = 400;
    throw error;
  }

  const eventRepository = ds.getRepository(Event);
  const event = await eventRepository.findOne({
    where: { id: eventId },
    relations: ["ticketTypes"],
  });

  if (!event) {
    const error = new Error("Event not found.");
    (error as any).statusCode = 404;
    throw error;
  }

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

  return formattedResponse;
};
