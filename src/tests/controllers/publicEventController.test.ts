import request from "supertest";
import express, { Express } from "express";
import { getDataSource } from "../../config/getDataSource";
import { Event } from "../../entities/Event";
import { getPublicEvents } from "../../controllers/publicEventController";

const app: Express = express();
app.use(express.json());

// Mount the public event route
app.get("/api/v1/events", getPublicEvents);

describe("Public Event Controller - GET /api/v1/events", () => {
  const eventRepository = getDataSource().getRepository(Event);

  const createTestEvent = async (props: Partial<Event>) => {
    const defaultEvent: Partial<Event> = {
      title: "Test Event " + Date.now() + Math.random(),
      description: "Test description",
      date: "2025-10-10",
      startTime: "10:00:00Z", // Store as UTC time string
      endTime: "12:00:00Z", // Store as UTC time string
      venue: "Test Venue",
      location: "Test Location",
      imageUrl: "https://example.com/image.jpg",
      priceRange: "$10-$20", // Not in public response, but good for entity
      categories: ["Test"],
      status: "published", // Not directly used by public filter yet, but good for data
      ...props,
    };
    return eventRepository.save(eventRepository.create(defaultEvent as Event));
  };

  beforeAll(async () => {
    // Create some initial events for testing
    await createTestEvent({
      title: "Music Festival",
      description: "A great music festival",
      categories: ["Music", "Festival"],
      date: "2025-07-26",
      startTime: "14:00:00Z",
      endTime: "23:00:00Z",
      venue: "City Park Amphitheater",
      location: "Metropolia, ST",
    });
    await createTestEvent({
      title: "Tech Conference",
      description: "Annual tech conference for developers",
      categories: ["Tech", "Networking", "Conference"],
      date: "2025-08-15",
      startTime: "09:00:00Z",
      endTime: "17:00:00Z",
      venue: "Metropolitan Convention Center",
      location: "Metropolia, ST",
    });
    await createTestEvent({
      title: "Art Expo",
      categories: ["Art", "Exhibition"],
      date: "2025-07-26", // Same date as Music Festival
      startTime: "10:00:00Z",
      endTime: "18:00:00Z",
    });
    await createTestEvent({
      title: "Cooking Workshop",
      categories: ["Food", "Workshop"],
      date: "2025-09-10",
      startTime: "13:00:00Z",
      endTime: "16:00:00Z",
    });
    // Event with null start/end times
    await createTestEvent({
      title: "Placeholder Event",
      categories: ["Misc"],
      date: "2025-11-01",
      //   startTime: null,
      //   endTime: null,
    });
  });

  afterAll(async () => {
    // Consider clearing all events if tests interfere, or use unique data per test block
    // For now, assuming TestDataSource setup handles cleanup or tests are isolated.
    // If not, add: await eventRepository.clear();
  });

  it("should return a paginated list of events", async () => {
    const response = await request(app).get("/api/v1/events?limit=2");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("pagination");
    expect(response.body.pagination.limit).toBe(2);
    expect(response.body.pagination.totalItems).toBeGreaterThanOrEqual(4); // At least the 4 created + 1 placeholder
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data.length).toBe(2);
    response.body.data.forEach((event: any) => {
      expect(event).toHaveProperty("id");
      expect(event).toHaveProperty("title");
      expect(event).toHaveProperty("imageUrl");
      expect(event).toHaveProperty("categories");
      expect(event).toHaveProperty("startTime"); // Can be string (ISO) or null
      expect(event).toHaveProperty("endTime"); // Can be string (ISO) or null
      expect(event).toHaveProperty("venue");
      expect(event).toHaveProperty("location");
    });
  });

  it("should filter events by search term 'q'", async () => {
    const response = await request(app).get("/api/v1/events?q=conference");
    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    response.body.data.forEach((event: any) => {
      expect(
        event.title.toLowerCase().includes("conference") ||
          (event.description &&
            event.description.toLowerCase().includes("conference"))
      ).toBeTruthy();
    });
  });

  it("should filter events by category", async () => {
    const response = await request(app).get("/api/v1/events?category=Music");
    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    response.body.data.forEach((event: any) => {
      expect(event.categories).toContain("Music");
    });
  });

  it("should filter events by date", async () => {
    const response = await request(app).get("/api/v1/events?date=2025-07-26");
    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2); // Music Festival and Art Expo
    response.body.data.forEach((event: any) => {
      // The date part of startTime should match, or if startTime is null, we can't check this way.
      // For this test, we know events on 2025-07-26 have startTimes.
      if (event.startTime) {
        expect(event.startTime.startsWith("2025-07-26")).toBeTruthy();
      }
    });
  });

  it("should handle combined filters: q, category, and date", async () => {
    const response = await request(app).get(
      "/api/v1/events?q=festival&category=Music&date=2025-07-26"
    );
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          categories: expect.arrayContaining(["Music"]),
          startTime: expect.stringMatching(/^2025-07-26T14:00:00\.000Z$/),
        }),
      ])
    );
  });

  it("should default to page 1 and limit 20", async () => {
    const response = await request(app).get("/api/v1/events");
    expect(response.status).toBe(200);
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(20);
  });

  it("should respect page and limit parameters", async () => {
    // Create enough events to test pagination
    for (let i = 0; i < 5; i++) {
      await createTestEvent({ title: `Page Event ${i}`, date: "2026-01-01" });
    }
    const responsePage1 = await request(app).get(
      "/api/v1/events?date=2026-01-01&limit=3&page=1"
    );
    expect(responsePage1.status).toBe(200);
    expect(responsePage1.body.data.length).toBe(3);
    expect(responsePage1.body.pagination.page).toBe(1);
    expect(responsePage1.body.pagination.limit).toBe(3);

    const responsePage2 = await request(app).get(
      "/api/v1/events?date=2026-01-01&limit=3&page=2"
    );
    expect(responsePage2.status).toBe(200);
    expect(responsePage2.body.data.length).toBeGreaterThanOrEqual(2); // 5 total, 3 on page 1, 2 on page 2
    expect(responsePage2.body.pagination.page).toBe(2);
  });

  it("should return 400 for invalid date format", async () => {
    const response = await request(app).get("/api/v1/events?date=26-07-2025");
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid date format. Use YYYY-MM-DD.");
  });

  it("should handle page < 1 by defaulting to page 1", async () => {
    const response = await request(app).get("/api/v1/events?page=0");
    expect(response.status).toBe(200);
    expect(response.body.pagination.page).toBe(1);
  });

  it("should return empty data array if no events match filters", async () => {
    const response = await request(app).get(
      "/api/v1/events?q=NonExistentEvent123&category=DoesNotExist"
    );
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.pagination.totalItems).toBe(0);
    expect(response.body.pagination.totalPages).toBe(0);
  });
});
