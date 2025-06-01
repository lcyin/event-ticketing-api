import request from "supertest";
import express from "express";
import { ticketTypeController } from "../../controllers/ticketTypeController";
import { TestDataSource } from "../../config/test-database";
import { Event } from "../../entities/Event";
import { TicketType } from "../../entities/TicketType";

const app = express();
app.use(express.json());

// Mount the ticket type controller routes
app.get(
  "/events/:eventId/ticket-types",
  ticketTypeController.getTicketTypesByEvent
);
app.get(
  "/events/:eventId/ticket-types/:id",
  ticketTypeController.getTicketTypeById
);
app.post(
  "/events/:eventId/ticket-types",
  ticketTypeController.createTicketType
);
app.put(
  "/events/:eventId/ticket-types/:id",
  ticketTypeController.updateTicketType
);
app.delete(
  "/events/:eventId/ticket-types/:id",
  ticketTypeController.deleteTicketType
);

describe("Ticket Type Controller", () => {
  const eventRepository = TestDataSource.getRepository(Event);
  const ticketTypeRepository = TestDataSource.getRepository(TicketType);

  const mockEvent = {
    title: "Test Event",
    description: "Test Description",
    date: "2024-03-01",
    venue: "Test Venue",
    location: "Test Location",
    image: "test-image.jpg",
    priceRange: "$10-$50",
    category: "Test Category",
  };

  const mockTicketType = {
    name: "VIP Ticket",
    price: 100.0,
    description: "VIP access with special benefits",
    available: 50,
    maxPerOrder: 4,
  };

  let testEvent: Event;

  beforeEach(async () => {
    await eventRepository.clear();
    await ticketTypeRepository.clear();
    testEvent = await eventRepository.save(mockEvent);
  });

  describe("POST /events/:eventId/ticket-types", () => {
    it("should create a new ticket type", async () => {
      const response = await request(app)
        .post(`/events/${testEvent.id}/ticket-types`)
        .send(mockTicketType);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe(mockTicketType.name);
    });

    it("should return 404 if event not found", async () => {
      const response = await request(app)
        .post("/events/non-existent-id/ticket-types")
        .send(mockTicketType);

      expect(response.status).toBe(404);
    });
  });

  describe("GET /events/:eventId/ticket-types", () => {
    it("should return all ticket types for an event", async () => {
      // Create test ticket types
      await ticketTypeRepository.save({ ...mockTicketType, event: testEvent });
      await ticketTypeRepository.save({
        ...mockTicketType,
        name: "Regular Ticket",
        event: testEvent,
      });

      const response = await request(app).get(
        `/events/${testEvent.id}/ticket-types`
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });
  });

  describe("GET /events/:eventId/ticket-types/:id", () => {
    it("should return a ticket type by id", async () => {
      const ticketType = await ticketTypeRepository.save({
        ...mockTicketType,
        event: testEvent,
      });

      const response = await request(app).get(
        `/events/${testEvent.id}/ticket-types/${ticketType.id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(ticketType.id);
    });

    it("should return 404 if ticket type not found", async () => {
      const response = await request(app).get(
        `/events/${testEvent.id}/ticket-types/non-existent-id`
      );

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /events/:eventId/ticket-types/:id", () => {
    it("should update a ticket type", async () => {
      const ticketType = await ticketTypeRepository.save({
        ...mockTicketType,
        event: testEvent,
      });

      const updatedData = { name: "Updated VIP Ticket" };

      const response = await request(app)
        .put(`/events/${testEvent.id}/ticket-types/${ticketType.id}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updatedData.name);
    });

    it("should return 404 if ticket type not found", async () => {
      const response = await request(app)
        .put(`/events/${testEvent.id}/ticket-types/non-existent-id`)
        .send({ name: "Updated Ticket" });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /events/:eventId/ticket-types/:id", () => {
    it("should delete a ticket type", async () => {
      const ticketType = await ticketTypeRepository.save({
        ...mockTicketType,
        event: testEvent,
      });

      const response = await request(app).delete(
        `/events/${testEvent.id}/ticket-types/${ticketType.id}`
      );

      expect(response.status).toBe(204);

      const deletedTicketType = await ticketTypeRepository.findOne({
        where: { id: ticketType.id },
      });
      expect(deletedTicketType).toBeNull();
    });

    it("should return 404 if ticket type not found", async () => {
      const response = await request(app).delete(
        `/events/${testEvent.id}/ticket-types/non-existent-id`
      );

      expect(response.status).toBe(404);
    });
  });
});
