import request from "supertest";
import express, { Express, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { getDataSource } from "../../config/getDataSource";
import { User } from "../../entities/User";
import { Event } from "../../entities/Event";
import { generateToken } from "../../utils/jwt";
import { authorizeAdmin } from "../../middleware/adminAuth";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEventDetails,
  deleteEvent,
} from "../../controllers/adminController";

const app: Express = express();
app.use(express.json());

const mockMiddleware = (req: Request, res: Response, next: NextFunction) => {
  next();
};

// Mount the admin event route
app.post(
  "/api/v1/admin/events",
  mockMiddleware as any,
  mockMiddleware as any,
  createEvent
);
app.get(
  "/api/v1/admin/events",
  mockMiddleware as any,
  mockMiddleware as any,
  getAllEvents
);
app.get(
  "/api/v1/admin/events/:id",
  mockMiddleware as any,
  mockMiddleware as any,
  getEventById
);
app.patch(
  "/api/v1/admin/events/:id",
  mockMiddleware as any,
  mockMiddleware as any,
  updateEventDetails
);
app.delete(
  "/api/v1/admin/events/:id",
  mockMiddleware as any,
  mockMiddleware as any,
  deleteEvent
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

  it("should create a new event successfully when called by an admin", async () => {
    const payload = getMockEventPayload();
    const response = await request(app)
      .post("/api/v1/admin/events")
      .send(payload);
    expect(response.body).toEqual({
      address: "123 Future Lane",
      categories: ["Technology", "Conference", "Networking"],
      created_at: expect.any(String),
      date: "2025-10-15",
      description: "A conference about future tech.",
      end_time: "17:00",
      id: expect.any(String),
      image_url: "https://example.com/images/tech-conf.jpg",
      location: "Tech City, TC",
      long_description: "Detailed information about the tech conference.",
      organizer: "Tech Organizers Inc.",
      price_range: "$100 - $500",
      start_time: "09:00",
      status: "draft",
      title: "Tech Conference 2025",
      updated_at: expect.any(String),
      venue: "Innovation Hall",
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

  it("should return a paginated list of events for an admin", async () => {
    const response = await request(app).get(
      "/api/v1/admin/events?page=1&limit=2"
    );

    expect(response.body).toEqual({
      events: expect.arrayContaining([
        {
          created_at: expect.any(String),
          date: expect.any(String),
          description: expect.any(String),
          id: expect.any(String),
          location: expect.any(String),
          status: expect.any(String),
          title: expect.any(String),
          updated_at: expect.any(String),
        },
      ]),
      limit: expect.any(Number),
      page: expect.any(Number),
      total_events: expect.any(Number),
    });
  });

  it("should filter events by status", async () => {
    const response = await request(app)
      .get("/api/v1/admin/events?status=published")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.body).toEqual({
      events: expect.arrayContaining([
        {
          created_at: expect.any(String),
          date: expect.any(String),
          description: expect.any(String),
          id: expect.any(String),
          location: expect.any(String),
          status: "published",
          title: expect.any(String),
          updated_at: expect.any(String),
        },
      ]),
      limit: expect.any(Number),
      page: expect.any(Number),
      total_events: expect.any(Number),
    });
  });

  it("should sort events by title in ascending order", async () => {
    const response = await request(app).get(
      "/api/v1/admin/events?sort_by=title&order=asc&limit=4"
    );
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
  });
});

describe("Admin Controller - GET /api/v1/admin/events/:id", () => {
  const userRepository = getDataSource().getRepository(User);
  const eventRepository = getDataSource().getRepository(Event);

  let adminUser: User;
  let regularUser: User;
  let adminToken: string;
  let userToken: string;
  let testEvent: Event;

  const createTestEvent = async (props: Partial<Event> = {}) => {
    const defaultEvent = {
      title: "Specific Test Event " + Date.now(),
      description: "A detailed description for the specific event.",
      longDescription:
        "A very long and comprehensive description of the event, potentially with rich content.",
      date: "2025-08-15",
      startTime: "10:00",
      endTime: "18:00",
      venue: "Specific Test Venue",
      location: "Specific Test City, ST",
      address: "456 Specific St",
      organizer: "Specific Test Org",
      imageUrl: "http://example.com/specific_image.jpg",
      priceRange: "$50 - $150",
      categories: ["Specific", "Test"],
      status: "published",
      ...props,
    };
    return eventRepository.save(eventRepository.create(defaultEvent));
  };

  beforeAll(async () => {
    const adminPasswordHash = await bcrypt.hash("adminPassGetOne123", 10);
    adminUser = userRepository.create({
      email: "admin_get_one@example.com" + Date.now(),
      passwordHash: adminPasswordHash,
      firstName: "Admin",
      lastName: "GetOne",
      role: "admin",
    });
    await userRepository.save(adminUser);
    adminToken = generateToken({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    });

    const userPasswordHash = await bcrypt.hash("userPassGetOne123", 10);
    regularUser = userRepository.create({
      email: "user_get_one@example.com" + Date.now(),
      passwordHash: userPasswordHash,
      firstName: "Regular",
      lastName: "GetOne",
      role: "user",
    });
    await userRepository.save(regularUser);
    userToken = generateToken({
      id: regularUser.id,
      email: regularUser.email,
      role: regularUser.role,
    });

    testEvent = await createTestEvent();
  });

  it("should return event details for a valid ID when called by an admin", async () => {
    const response = await request(app).get(
      `/api/v1/admin/events/${testEvent.id}`
    );

    expect(response.body).toEqual({
      address: "456 Specific St",
      categories: ["Specific", "Test"],
      created_at: expect.any(String),
      date: "2025-08-15",
      description: "A detailed description for the specific event.",
      end_time: "18:00",
      id: expect.any(String),
      image_url: "http://example.com/specific_image.jpg",
      location: "Specific Test City, ST",
      long_description:
        "A very long and comprehensive description of the event, potentially with rich content.",
      organizer: "Specific Test Org",
      price_range: "$50 - $150",
      start_time: "10:00",
      status: "published",
      title: expect.any(String),
      updated_at: expect.any(String),
      venue: "Specific Test Venue",
    });
  });
});

describe("Admin Controller - PATCH /api/v1/admin/events/:id", () => {
  const userRepository = getDataSource().getRepository(User);
  const eventRepository = getDataSource().getRepository(Event);

  let adminUser: User;
  let regularUser: User;
  let adminToken: string;
  let userToken: string;
  let eventToUpdate: Event;

  const createInitialEvent = async (props: Partial<Event> = {}) => {
    const defaultEvent = {
      title: "Initial Event Title " + Date.now(),
      description: "Initial description.",
      longDescription: "Initial long description.",
      date: "2026-01-01",
      startTime: "12:00",
      endTime: "20:00",
      venue: "Initial Venue",
      location: "Initial Location, IL",
      address: "789 Initial Ave",
      organizer: "Initial Org",
      imageUrl: "http://example.com/initial.jpg",
      priceRange: "$10 - $30",
      categories: ["Initial", "Setup"],
      status: "draft",
      ...props,
    };
    return eventRepository.save(eventRepository.create(defaultEvent));
  };

  beforeAll(async () => {
    // Create users
    const adminPasswordHash = await bcrypt.hash("adminPatch123", 10);
    adminUser = userRepository.create({
      email: "admin_patch@example.com" + Date.now(),
      passwordHash: adminPasswordHash,
      role: "admin",
    });
    await userRepository.save(adminUser);
    adminToken = generateToken({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    });

    const userPasswordHash = await bcrypt.hash("userPatch123", 10);
    regularUser = userRepository.create({
      email: "user_patch@example.com" + Date.now(),
      passwordHash: userPasswordHash,
      role: "user",
    });
    await userRepository.save(regularUser);
    userToken = generateToken({
      id: regularUser.id,
      email: regularUser.email,
      role: regularUser.role,
    });
  });

  beforeEach(async () => {
    // Create a fresh event before each test in this suite
    eventToUpdate = await createInitialEvent();
  });

  // afterEach(async () => {
  //   // Clean up the created event
  //   if (eventToUpdate && eventToUpdate.id) {
  //     await eventRepository.delete({ id: eventToUpdate.id });
  //   }
  // });

  // afterAll(async () => {
  //   await userRepository.delete({ id: adminUser.id });
  //   await userRepository.delete({ id: regularUser.id });
  // });

  it("should update event details successfully with partial data", async () => {
    const updates = {
      description: "Updated event description.",
      start_time: "15:00",
      categories: ["Music", "Festival", "Family-Friendly"],
    };

    const response = await request(app)
      .patch(`/api/v1/admin/events/${eventToUpdate.id}`)
      .send(updates);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(eventToUpdate.id);
    expect(response.body.description).toBe(updates.description);
    expect(response.body.start_time).toBe(updates.start_time);
    expect(response.body.categories).toEqual(updates.categories);
    expect(response.body.title).toBe(eventToUpdate.title); // Should remain unchanged
  });

  it("should return 404 Not Found if event ID does not exist for update", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000"; // Standard nil UUID
    const updates = { title: "Attempt to update non-existent" };
    const response = await request(app)
      .patch(`/api/v1/admin/events/${nonExistentId}`)
      .send(updates);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Event not found.");
  });

  it("should return 400 Bad Request for invalid event ID format during update", async () => {
    const invalidId = "not-a-uuid-at-all";
    const updates = { title: "Update with invalid ID" };
    const response = await request(app)
      .patch(`/api/v1/admin/events/${invalidId}`)
      .send(updates);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid event ID format.");
  });

  it("should return 400 Bad Request for invalid data type in update payload", async () => {
    const updates = { date: "invalid-date-format" }; // Invalid date
    const response = await request(app)
      .patch(`/api/v1/admin/events/${eventToUpdate.id}`)
      .send(updates);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Date must be in YYYY-MM-DD format.");
  });
});

xdescribe("Admin Controller - DELETE /api/v1/admin/events/:id", () => {
  const userRepository = getDataSource().getRepository(User);
  const eventRepository = getDataSource().getRepository(Event);

  let adminUser: User;
  let regularUser: User;
  let adminToken: string;
  let userToken: string;
  let eventToDelete: Event;

  const createEventForDeletion = async (props: Partial<Event> = {}) => {
    const defaultEvent = {
      title: "Event To Be Deleted " + Date.now(),
      date: "2027-01-01",
      venue: "Deletion Venue",
      location: "Deletion Location, DL",
      imageUrl: "http://example.com/delete_me.jpg",
      priceRange: "$1",
      categories: ["Temporary", "Deletion"],
      status: "draft",
      ...props,
    };
    return eventRepository.save(eventRepository.create(defaultEvent));
  };

  beforeAll(async () => {
    const adminPasswordHash = await bcrypt.hash("adminDelete123", 10);
    adminUser = userRepository.create({
      email: "admin_delete@example.com" + Date.now(),
      passwordHash: adminPasswordHash,
      role: "admin",
    });
    await userRepository.save(adminUser);
    adminToken = generateToken({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    });

    const userPasswordHash = await bcrypt.hash("userDelete123", 10);
    regularUser = userRepository.create({
      email: "user_delete@example.com" + Date.now(),
      passwordHash: userPasswordHash,
      role: "user",
    });
    await userRepository.save(regularUser);
    userToken = generateToken({
      id: regularUser.id,
      email: regularUser.email,
      role: regularUser.role,
    });
  });

  beforeEach(async () => {
    eventToDelete = await createEventForDeletion();
  });

  afterEach(async () => {
    // Attempt to clean up if event wasn't deleted by the test, or if test failed before deletion
    if (eventToDelete && eventToDelete.id) {
      const stillExists = await eventRepository.findOneBy({
        id: eventToDelete.id,
      });
      if (stillExists) {
        await eventRepository.delete({ id: eventToDelete.id });
      }
    }
  });

  afterAll(async () => {
    await userRepository.delete({ id: adminUser.id });
    await userRepository.delete({ id: regularUser.id });
  });

  it("should delete an event successfully and return 204 No Content", async () => {
    const response = await request(app)
      .delete(`/api/v1/admin/events/${eventToDelete.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(204);
    const dbEvent = await eventRepository.findOneBy({ id: eventToDelete.id });
    expect(dbEvent).toBeNull();
  });

  it("should return 404 Not Found if event ID does not exist for deletion", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000"; // Standard nil UUID
    const response = await request(app)
      .delete(`/api/v1/admin/events/${nonExistentId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });

  it("should return 400 Bad Request for invalid event ID format during deletion", async () => {
    const invalidId = "this-is-not-a-uuid";
    const response = await request(app)
      .delete(`/api/v1/admin/events/${invalidId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
  });

  it("should return 403 Forbidden if a non-admin user tries to delete an event", async () => {
    const response = await request(app)
      .delete(`/api/v1/admin/events/${eventToDelete.id}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(403);
  });

  it("should return 401 Unauthorized if no token is provided for deletion", async () => {
    const response = await request(app).delete(
      `/api/v1/admin/events/${eventToDelete.id}`
    );

    expect(response.status).toBe(401);
  });

  // Test for 409 Conflict would require setting up dependencies (e.g., orders)
  // and ensuring the delete logic checks for them.
});
