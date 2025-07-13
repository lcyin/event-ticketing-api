import { DataSource } from "typeorm";
import { Event } from "../entities/Event";
import { TicketType } from "../entities/TicketType";

interface CreateTicketTypeData {
  name: string;
  price: number;
  description?: string;
  quantity: number;
}

export const createTicketTypeDB = async (
  dataSource: DataSource,
  eventId: string,
  ticketTypeData: CreateTicketTypeData
): Promise<TicketType> => {
  const eventRepository = dataSource.getRepository(Event);
  const event = await eventRepository.findOneBy({ id: eventId });

  if (!event) {
    throw new Error("Event not found.");
  }

  const ticketTypeRepository = dataSource.getRepository(TicketType);
  const newTicketType = ticketTypeRepository.create({
    ...ticketTypeData,
    eventId,
    event,
  });

  return ticketTypeRepository.save(newTicketType);
};
