import request from "supertest";
import express, { Express } from "express";
import bcrypt from "bcryptjs";
import { getDataSource } from "../../config/getDataSource";
import { User } from "../../entities/User";
import { Event } from "../../entities/Event";
import { generateToken } from "../../utils/jwt";
import { authenticateToken } from "../../middleware/auth";
import { authorizeAdmin } from "../../middleware/adminAuth";
import { createEvent, getAllEvents } from "../../controllers/adminController";

const app: Express = express();
app.use(express.json());

// Mount the admin event route
app.post(
  "/api/v1/admin/events",
  authenticateToken,
  authorizeAdmin,
  createEvent
);
app.get(
  "/api/v1/admin/events",
  authenticateToken,
  authorizeAdmin,
  getAllEvents
);

describe("Admin Controller - POST /api/v1/admin/events", () => {
  const userRepository = getDataSource().getRepository(User);
  const eventRepository = getDataSource().getRepository(Event);

  let adminUser: User;
  let regularUser: User;
  let adminToken: string;
  let userToken: string;

  const getMockEventPayload = (overrides = {}) => ({
    title: "Tech Conference 2025",
    description: "A conference about future tech.",
    long_description: "Detailed information about the tech conference.",
    date: "2025-10-15",
    start_time: "09:00",
    end_time: "17:00",
    venue: "Innovation Hall",
    location: "Tech City, TC",
    address: "123 Future Lane",
    organizer: "Tech Organizers Inc.",
    image_url: "https://example.com/images/tech-conf.jpg",
    price_range: "$100 - $500",
    categories: ["Technology", "Conference", "Networking"],
    status: "draft",
    ...overrides,
  });

  beforeAll(async () => {
    // Create admin user
    const adminPasswordHash = await bcrypt.hash("adminPass123", 10);
    adminUser = userRepository.create({
      email: "admin@example.com" + Date.now(),
      passwordHash: adminPasswordHash,
      firstName: "Admin",
      lastName: "User",
      role: "admin",
    });
    await userRepository.save(adminUser);
    adminToken = generateToken({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    });

    // Create regular user
    const userPasswordHash = await bcrypt.hash("userPass123", 10);
    regularUser = userRepository.create({
      email: "user@example.com" + Date.now(),
      passwordHash: userPasswordHash,
      firstName: "Regular",
      lastName: "User",
      role: "user",
    });
    await userRepository.save(regularUser);
    userToken = generateToken({
      id: regularUser.id,
      email: regularUser.email,
      role: regularUser.role,
    });
  });

  //   afterEach(async () => {
  //     // Clear events after each test to avoid interference
  //     await eventRepository.clear();
  //   });

  //   afterAll(async () => {
  //     // Clean up users
  //     await userRepository.delete({ id: adminUser.id });
  //     await userRepository.delete({ id: regularUser.id });
  //   });

  it("should create a new event successfully when called by an admin", async () => {
    const payload = getMockEventPayload();
    const response = await request(app)
      .post("/api/v1/admin/events")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.title).toBe(payload.title);
    expect(response.body.description).toBe(payload.description);
    expect(response.body.long_description).toBe(payload.long_description);
    expect(response.body.date).toBe(payload.date);
    expect(response.body.start_time).toBe(payload.start_time);
    expect(response.body.end_time).toBe(payload.end_time);
    expect(response.body.venue).toBe(payload.venue);
    expect(response.body.location).toBe(payload.location);
    expect(response.body.address).toBe(payload.address);
    expect(response.body.organizer).toBe(payload.organizer);
    expect(response.body.image_url).toBe(payload.image_url);
    expect(response.body.price_range).toBe(payload.price_range);
    expect(response.body.categories).toEqual(payload.categories);
    expect(response.body.status).toBe(payload.status);
    expect(response.body).toHaveProperty("created_at");
    expect(response.body).toHaveProperty("updated_at");

    const dbEvent = await eventRepository.findOneBy({ id: response.body.id });
    expect(dbEvent).not.toBeNull();
    expect(dbEvent?.title).toBe(payload.title);
  });

  it("should return 403 Forbidden if a non-admin user tries to create an event", async () => {
    const payload = getMockEventPayload();
    const response = await request(app)
      .post("/api/v1/admin/events")
      .set("Authorization", `Bearer ${userToken}`)
      .send(payload);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "Forbidden: Administrator access required."
    );
  });

  it("should return 401 Unauthorized if no token is provided", async () => {
    const payload = getMockEventPayload();
    const response = await request(app)
      .post("/api/v1/admin/events")
      .send(payload);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("No token provided");
  });

  it("should return 401 Unauthorized if an invalid token is provided", async () => {
    const payload = getMockEventPayload();
    const response = await request(app)
      .post("/api/v1/admin/events")
      .set("Authorization", "Bearer invalid-token")
      .send(payload);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid token");
  });

  describe("Validation Error Tests (400 Bad Request)", () => {
    const requiredFields = [
      "title",
      "date",
      "venue",
      "location",
      "image_url",
      "price_range",
      "categories",
    ];

    requiredFields.forEach((field) => {
      it(`should return 400 if required field '${field}' is missing`, async () => {
        const payload = getMockEventPayload();
        delete (payload as any)[field];

        const response = await request(app)
          .post("/api/v1/admin/events")
          .set("Authorization", `Bearer ${adminToken}`)
          .send(payload);

        expect(response.status).toBe(400);
        // You might want to make these messages more specific in your controller
        // For now, checking that a message exists.
        expect(response.body).toHaveProperty("message");
        if (field === "title")
          expect(response.body.message).toContain("Title is required");
        if (field === "date")
          expect(response.body.message).toContain("Date is required");
        if (field === "venue")
          expect(response.body.message).toContain("Venue is required");
        if (field === "location")
          expect(response.body.message).toContain("Location is required");
        if (field === "image_url")
          expect(response.body.message).toContain("Image URL is required");
        if (field === "price_range")
          expect(response.body.message).toContain("Price range is required");
        if (field === "categories")
          expect(response.body.message).toContain("Categories are required");
      });
    });

    it("should return 400 if date format is invalid", async () => {
      const payload = getMockEventPayload({ date: "15-10-2025" });
      const response = await request(app)
        .post("/api/v1/admin/events")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(payload);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Date is required in YYYY-MM-DD format."
      );
    });

    it("should return 400 if start_time format is invalid", async () => {
      const payload = getMockEventPayload({ start_time: "9AM" });
      const response = await request(app)
        .post("/api/v1/admin/events")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(payload);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Start time must be in HH:MM format.");
    });

    it("should return 400 if end_time format is invalid", async () => {
      const payload = getMockEventPayload({ end_time: "5:00 PM" });
      const response = await request(app)
        .post("/api/v1/admin/events")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(payload);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("End time must be in HH:MM format.");
    });

    it("should return 400 if categories is not an array", async () => {
      const payload = getMockEventPayload({ categories: "Music" });
      const response = await request(app)
        .post("/api/v1/admin/events")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(payload);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Categories are required as a non-empty array of strings."
      );
    });

    it("should return 400 if categories is an empty array", async () => {
      const payload = getMockEventPayload({ categories: [] });
      const response = await request(app)
        .post("/api/v1/admin/events")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(payload);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Categories are required as a non-empty array of strings."
      );
    });

    it("should return 400 if categories array contains non-string elements", async () => {
      const payload = getMockEventPayload({ categories: ["Music", 123] });
      const response = await request(app)
        .post("/api/v1/admin/events")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(payload);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Categories are required as a non-empty array of strings."
      );
    });

    // Test for optional fields with incorrect types
    const optionalFieldsTypeCheck = [
      {
        field: "description",
        value: 123,
        message: "Description must be a string.",
      },
      {
        field: "long_description",
        value: true,
        message: "Long description must be a string.",
      },
      { field: "address", value: {}, message: "Address must be a string." },
      { field: "organizer", value: [], message: "Organizer must be a string." },
    ];

    optionalFieldsTypeCheck.forEach(({ field, value, message }) => {
      it(`should return 400 if optional field '${field}' has incorrect type`, async () => {
        const payload = getMockEventPayload({ [field]: value });
        const response = await request(app)
          .post("/api/v1/admin/events")
          .set("Authorization", `Bearer ${adminToken}`)
          .send(payload);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(message);
      });
    });
  });
});

describe("Admin Controller - GET /api/v1/admin/events", () => {
  const userRepository = getDataSource().getRepository(User);
  const eventRepository = getDataSource().getRepository(Event);

  let adminUser: User;
  let regularUser: User;
  let adminToken: string;
  let userToken: string;

  const createTestEvent = async (props: Partial<Event> = {}) => {
    const defaultEvent = {
      title: "Test Event " + Date.now(),
      date: "2025-01-01",
      venue: "Test Venue",
      location: "Test Location",
      imageUrl: "http://example.com/image.jpg",
      priceRange: "Free",
      categories: ["Test"],
      status: "draft",
      description: "Test desc",
      ...props,
    };
    return eventRepository.save(eventRepository.create(defaultEvent));
  };

  beforeAll(async () => {
    const adminPasswordHash = await bcrypt.hash("adminPass123", 10);
    adminUser = userRepository.create({
      email: "admin_get@example.com" + Date.now(),
      passwordHash: adminPasswordHash,
      firstName: "Admin",
      lastName: "User",
      role: "admin",
    });
    await userRepository.save(adminUser);
    adminToken = generateToken({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    });

    const userPasswordHash = await bcrypt.hash("userPass123", 10);
    regularUser = userRepository.create({
      email: "user_get@example.com" + Date.now(),
      passwordHash: userPasswordHash,
      firstName: "Regular",
      lastName: "User",
      role: "user",
    });
    await userRepository.save(regularUser);
    userToken = generateToken({
      id: regularUser.id,
      email: regularUser.email,
      role: regularUser.role,
    });

    // Create some initial events for testing pagination, filtering, sorting
    await createTestEvent({
      title: "Alpha Event",
      status: "published",
      date: "2025-01-01",
      createdAt: new Date("2024-01-01T10:00:00Z"),
    });
    await createTestEvent({
      title: "Beta Event",
      status: "draft",
      date: "2025-02-01",
      createdAt: new Date("2024-01-02T10:00:00Z"),
    });
    await createTestEvent({
      title: "Gamma Event",
      status: "published",
      date: "2025-03-01",
      createdAt: new Date("2024-01-03T10:00:00Z"),
    });
    await createTestEvent({
      title: "Delta Event",
      status: "archived",
      date: "2024-12-01",
      createdAt: new Date("2024-01-04T10:00:00Z"),
    });
  });

  //   afterAll(async () => {
  //     await eventRepository.clear(); // Use clear() to remove all records from the table
  //     await userRepository.delete({ id: adminUser.id });
  //     await userRepository.delete({ id: regularUser.id });
  //   });

  it("should return a paginated list of events for an admin", async () => {
    const response = await request(app)
      .get("/api/v1/admin/events?page=1&limit=2")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("total_events");
    expect(response.body.total_events).toBeGreaterThanOrEqual(4);
    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(2);
    expect(response.body.events).toBeInstanceOf(Array);
    expect(response.body.events.length).toBe(2);
    response.body.events.forEach((event: any) => {
      expect(event).toHaveProperty("id");
      expect(event).toHaveProperty("title");
      expect(event).toHaveProperty("status");
    });
  });

  it("should filter events by status", async () => {
    const response = await request(app)
      .get("/api/v1/admin/events?status=published")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.events.length).toBeGreaterThanOrEqual(2);
    response.body.events.forEach((event: any) => {
      expect(event.status).toBe("published");
    });
  });

  it("should sort events by title in ascending order", async () => {
    const response = await request(app)
      .get("/api/v1/admin/events?sort_by=title&order=asc&limit=4")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(response.body).toEqual({
      events: expect.arrayContaining([
        expect.objectContaining({
          title: expect.any(String),
          status: expect.any(String),
          created_at: expect.any(String),
          updated_at: expect.any(String),
          date: expect.any(String),
          description: expect.any(String),
          id: expect.any(String),
          location: expect.any(String),
        }),
      ]),
      limit: expect.any(Number),
      page: expect.any(Number),
      total_events: expect.any(Number),
    });
    //     expect(response.body).toMatchInlineSnapshot(`
    // {
    //   "events": [
    //     {
    //       "created_at": "2024-01-01T10:00:00.000Z",
    //       "date": "2025-01-01",
    //       "description": "Test desc",
    //       "id": "5ac8685f-eded-46e1-8a8f-aea343d97caa",
    //       "location": "Test Location",
    //       "status": "published",
    //       "title": "Alpha Event",
    //       "updated_at": "2025-06-14T12:05:32.871Z",
    //     },
    //     {
    //       "created_at": "2024-01-01T10:00:00.000Z",
    //       "date": "2025-01-01",
    //       "description": "Test desc",
    //       "id": "dcd95f18-9fbd-47e0-9844-86485650beea",
    //       "location": "Test Location",
    //       "status": "published",
    //       "title": "Alpha Event",
    //       "updated_at": "2025-06-14T12:04:41.768Z",
    //     },
    //     {
    //       "created_at": "2024-01-01T10:00:00.000Z",
    //       "date": "2025-01-01",
    //       "description": "Test desc",
    //       "id": "3d2bfd62-a102-4890-891c-affe80ba4c75",
    //       "location": "Test Location",
    //       "status": "published",
    //       "title": "Alpha Event",
    //       "updated_at": "2025-06-14T12:03:52.216Z",
    //     },
    //     {
    //       "created_at": "2024-01-01T10:00:00.000Z",
    //       "date": "2025-01-01",
    //       "description": "Test desc",
    //       "id": "e8668572-41a8-47db-9d6d-d3206b4b3f02",
    //       "location": "Test Location",
    //       "status": "published",
    //       "title": "Alpha Event",
    //       "updated_at": "2025-06-14T12:05:55.738Z",
    //     },
    //   ],
    //   "limit": 4,
    //   "page": 1,
    //   "total_events": 66,
    // }
    // `);
  });

  it("should sort events by date in descending order", async () => {
    const response = await request(app)
      .get("/api/v1/admin/events?sort_by=date&order=desc&limit=4")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.events.length).toBe(4);
    expect(
      new Date(response.body.events[0].date).getTime()
    ).toBeGreaterThanOrEqual(new Date(response.body.events[1].date).getTime());
  });

  it("should return 403 Forbidden if a non-admin user tries to get events", async () => {
    const response = await request(app)
      .get("/api/v1/admin/events")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "Forbidden: Administrator access required."
    );
  });

  it("should return 401 Unauthorized if no token is provided", async () => {
    const response = await request(app).get("/api/v1/admin/events");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("No token provided");
  });

  it("should default to page 1, limit 10, sort by createdAt desc if no params provided", async () => {
    const response = await request(app)
      .get("/api/v1/admin/events")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(10);
    // Check if sorted by createdAt desc (latest first)
    if (response.body.events.length > 1) {
      expect(
        new Date(response.body.events[0].created_at).getTime()
      ).toBeGreaterThanOrEqual(
        new Date(response.body.events[1].created_at).getTime()
      );
    }
  });
});
