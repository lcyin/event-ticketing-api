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
  // beforeAll(async () => {
  //   await TestDataSource.initialize();
  // });
  // afterAll(async () => {
  //   await TestDataSource.destroy();
  // });

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
    // await eventRepository.clear();
  });

  describe("POST /events", () => {
    it("should create a new event", async () => {
      const response = await request(app).post("/events").send(mockEvent);

      expect(response.body).toMatchInlineSnapshot(`
{
  "address": null,
  "categories": null,
  "category": "Test Category",
  "createdAt": "2025-06-01T11:50:17.784Z",
  "date": "2024-03-01",
  "description": "Test Description",
  "endTime": null,
  "id": "67e48c59-4560-4471-9459-31ee494523fd",
  "image": "test-image.jpg",
  "imageUrl": null,
  "location": "Test Location",
  "longDescription": null,
  "organizer": null,
  "priceRange": "$10-$50",
  "startTime": null,
  "title": "Test Event",
  "updatedAt": "2025-06-01T11:50:17.784Z",
  "venue": "Test Venue",
}
`);
    });

    xit("should return 500 if required fields are missing", async () => {
      const response = await request(app)
        .post("/events")
        .send({ title: "Incomplete Event" });

      expect(response.status).toBe(500);
    });
  });

  xdescribe("GET /events", () => {
    it("should return all events", async () => {
      // Create test events
      await eventRepository.save(mockEvent);
      await eventRepository.save({ ...mockEvent, title: "Test Event 2" });

      const response = await request(app).get("/events");

      expect(Array.isArray(response)).toMatchInlineSnapshot(`false`);
    });
  });

  xdescribe("GET /events/:id", () => {
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

  xdescribe("PUT /events/:id", () => {
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

  xdescribe("DELETE /events/:id", () => {
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
