import request from "supertest";
import express from "express";
import { eventController } from "../../controllers/eventController";
import { TestDataSource } from "../../config/test-database";
import { Event } from "../../entities/Event";

const app = express();
app.use(express.json());

// Mount the event controller routes
app.get("/events", eventController.getAllEvents);
app.get("/events/:id", eventController.getEventById);
app.post("/events", eventController.createEvent);
app.put("/events/:id", eventController.updateEvent);
app.delete("/events/:id", eventController.deleteEvent);

describe("Event Controller", () => {
  const eventRepository = TestDataSource.getRepository(Event);

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

  beforeEach(async () => {
    await eventRepository.clear();
  });

  describe("POST /events", () => {
    it("should create a new event", async () => {
      const response = await request(app).post("/events").send(mockEvent);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.title).toBe(mockEvent.title);
    });

    it("should return 500 if required fields are missing", async () => {
      const response = await request(app)
        .post("/events")
        .send({ title: "Incomplete Event" });

      expect(response.status).toBe(500);
    });
  });

  describe("GET /events", () => {
    it("should return all events", async () => {
      // Create test events
      await eventRepository.save(mockEvent);
      await eventRepository.save({ ...mockEvent, title: "Test Event 2" });

      const response = await request(app).get("/events");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });
  });

  describe("GET /events/:id", () => {
    it("should return an event by id", async () => {
      const event = await eventRepository.save(mockEvent);

      const response = await request(app).get(`/events/${event.id}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(event.id);
    });

    it("should return 404 if event not found", async () => {
      const response = await request(app).get("/events/non-existent-id");

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /events/:id", () => {
    it("should update an event", async () => {
      const event = await eventRepository.save(mockEvent);
      const updatedData = { title: "Updated Event" };

      const response = await request(app)
        .put(`/events/${event.id}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updatedData.title);
    });

    it("should return 404 if event not found", async () => {
      const response = await request(app)
        .put("/events/non-existent-id")
        .send({ title: "Updated Event" });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /events/:id", () => {
    it("should delete an event", async () => {
      const event = await eventRepository.save(mockEvent);

      const response = await request(app).delete(`/events/${event.id}`);

      expect(response.status).toBe(204);

      const deletedEvent = await eventRepository.findOne({
        where: { id: event.id },
      });
      expect(deletedEvent).toBeNull();
    });

    it("should return 404 if event not found", async () => {
      const response = await request(app).delete("/events/non-existent-id");

      expect(response.status).toBe(404);
    });
  });
});
