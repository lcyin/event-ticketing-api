import { TestDataSource } from "../config/test-database";

// Global setup - runs once before all tests
beforeAll(async () => {
  try {
    await TestDataSource.initialize();
    console.log("Test database connection established");
  } catch (error) {
    console.error("Error during Test Data Source initialization:", error);
    throw error;
  }
});

// Global teardown - runs once after all tests
afterAll(async () => {
  try {
    await TestDataSource.destroy();
    console.log("Test database connection closed");
  } catch (error) {
    console.error("Error during Test Data Source destruction:", error);
    throw error;
  }
});

// // Clean up database before each test
// beforeEach(async () => {
//   const eventRepository = TestDataSource.getRepository(Event);
//   const ticketTypeRepository = TestDataSource.getRepository(TicketType);
//   const faqRepository = TestDataSource.getRepository(FAQ);
//   const orderRepository = TestDataSource.getRepository(Order);

//   await orderRepository.clear();
//   await ticketTypeRepository.clear();
//   await faqRepository.clear();
//   await eventRepository.clear();
// });
