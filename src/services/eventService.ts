import { DataSource } from "typeorm";
import { Event } from "../entities/Event";
import { IEvent } from "../types/event.type";

export const createEventDB = async (ds: DataSource, eventData: IEvent) => {
  const eventRepository = ds.getRepository(Event);

  const newEvent = eventRepository.create(eventData);

  const savedEvent = await eventRepository.save(newEvent);

  return savedEvent;
};
