import { TestDataSource } from "../config/test-database";
import { Event } from "../entities/Event";
import { TicketType } from "../entities/TicketType";
import { FAQ } from "../entities/FAQ";
import { Order } from "../entities/Order";

beforeAll(async () => {
  await TestDataSource.initialize();
});

afterAll(async () => {
  await TestDataSource.destroy();
});

afterEach(async () => {
  // Get repositories using entity classes
  const orderRepository = TestDataSource.getRepository(Order);
  const ticketTypeRepository = TestDataSource.getRepository(TicketType);
  const faqRepository = TestDataSource.getRepository(FAQ);
  const eventRepository = TestDataSource.getRepository(Event);

  // Delete in reverse order of dependencies
  await orderRepository.delete({});
  await ticketTypeRepository.delete({});
  await faqRepository.delete({});
  await eventRepository.delete({});
});
