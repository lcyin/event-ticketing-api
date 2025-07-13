import { DataSource } from "typeorm";
import { Event } from "../entities/Event";
import { IEvent } from "../types/event.type";

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
