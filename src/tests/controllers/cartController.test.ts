import request from "supertest";
import express, { Express } from "express";
import bcrypt from "bcryptjs";
import { getDataSource } from "../../config/getDataSource";
import { User } from "../../entities/User";
import { Event } from "../../entities/Event";
import { TicketType } from "../../entities/TicketType";
import { generateToken } from "../../utils/jwt";
import { authenticateToken } from "../../middleware/auth";
import { addItemToCart } from "../../controllers/cartController";
import * as cartService from "../../services/cartService";

const app: Express = express();
app.use(express.json());

// Mount the cart route with authentication middleware
app.post("/api/v1/cart/items", authenticateToken, addItemToCart);

describe("Cart Controller - POST /api/v1/cart/items", () => {
  const userRepository = getDataSource().getRepository(User);
  const eventRepository = getDataSource().getRepository(Event);
  const ticketTypeRepository = getDataSource().getRepository(TicketType);

  let testUser: User;
  let userToken: string;
  let testEvent: Event;
  let generalTicket: TicketType;
  let vipTicket: TicketType;
  let limitedTicket: TicketType;

  beforeAll(async () => {
    // Create a test user
    const passwordHash = await bcrypt.hash("cartPass123", 10);
    testUser = await userRepository.save(
      userRepository.create({
        email: "cart.user@example.com" + Date.now(),
        passwordHash,
        role: "user",
      })
    );
    userToken = generateToken({
      id: testUser.id,
      email: testUser.email,
      role: "user",
    });

    // Create a test event
    testEvent = await eventRepository.save(
      eventRepository.create({
        title: "Cart Test Event",
        date: "2028-01-01",
        venue: "Cart Venue",
        location: "Cart Location",
        imageUrl: "http://example.com/cart.jpg",
        priceRange: "$10-$100",
        categories: ["CartTest"],
      })
    );

    // Create ticket types
    generalTicket = await ticketTypeRepository.save(
      ticketTypeRepository.create({
        eventId: testEvent.id,
        name: "General",
        price: 1000,
        quantity: 100,
      })
    );
    vipTicket = await ticketTypeRepository.save(
      ticketTypeRepository.create({
        eventId: testEvent.id,
        name: "VIP",
        price: 5000,
        quantity: 50,
      })
    );
    limitedTicket = await ticketTypeRepository.save(
      ticketTypeRepository.create({
        eventId: testEvent.id,
        name: "Limited",
        price: 2000,
        quantity: 5, // Low quantity for testing limits
      })
    );
  });

  beforeEach(() => {
    // Clear the cart for the user before each test
    cartService.clearCart(testUser.id);
  });

  it("should add a new item to an empty cart", async () => {
    const response = await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ ticket_type_id: generalTicket.id, quantity: 2 });

    expect(response.status).toBe(200);
    expect(response.body.items.length).toBe(1);
    expect(response.body.items[0]).toEqual({
      ticket_type_id: generalTicket.id,
      quantity: 2,
    });
    expect(response.body.totalItems).toBe(2);
  });

  it("should add a second item to the cart", async () => {
    // Add first item
    await cartService.addItemToCart(testUser.id, generalTicket.id, 1);

    // Add second item
    const response = await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ ticket_type_id: vipTicket.id, quantity: 1 });

    expect(response.status).toBe(200);
    expect(response.body.items.length).toBe(2);
    expect(response.body.totalItems).toBe(2);
  });

  it("should update the quantity of an existing item in the cart", async () => {
    // Add first item
    await cartService.addItemToCart(testUser.id, generalTicket.id, 1);

    // Add more of the same item
    const response = await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ ticket_type_id: generalTicket.id, quantity: 3 });

    expect(response.status).toBe(200);
    expect(response.body.items.length).toBe(1);
    expect(response.body.items[0].quantity).toBe(4); // 1 + 3
    expect(response.body.totalItems).toBe(4);
  });

  it("should return 400 for insufficient ticket quantity", async () => {
    const response = await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ ticket_type_id: limitedTicket.id, quantity: 6 }); // Only 5 available

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("Not enough tickets available");
  });

  it("should return 404 for a non-existent ticket_type_id", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";
    const response = await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ ticket_type_id: nonExistentId, quantity: 1 });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Ticket type not found.");
  });

  it("should return 400 for invalid quantity (zero)", async () => {
    const response = await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ ticket_type_id: generalTicket.id, quantity: 0 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Invalid input: quantity must be a positive integer."
    );
  });

  it("should return 400 for missing ticket_type_id", async () => {
    const response = await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ quantity: 1 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Invalid input: ticket_type_id is required."
    );
  });
});
