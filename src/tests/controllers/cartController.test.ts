import request from "supertest";
import express, { Express } from "express";
import bcrypt from "bcryptjs";
import { getDataSource } from "../../config/getDataSource";
import { User } from "../../entities/User";
import { Event } from "../../entities/Event";
import { TicketType } from "../../entities/TicketType";
import { generateToken } from "../../utils/jwt";
import { authenticateToken } from "../../middleware/auth";
import {
  addItemToCart,
  getCartContents,
} from "../../controllers/cartController";
import * as cartService from "../../services/cartService";

const app: Express = express();
app.use(express.json());

// Mount the cart route with authentication middleware
app.post("/api/v1/cart/items", authenticateToken, addItemToCart);
app.get("/api/v1/cart", authenticateToken, getCartContents);

describe("Cart Controller", () => {
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

  describe("POST /api/v1/cart/items", () => {
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

  describe("GET /api/v1/cart", () => {
    it("should return an empty cart for a user with no items", async () => {
      const response = await request(app)
        .get("/api/v1/cart")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        items: [],
        totalItems: 0,
        subtotal: "0.00",
      });
    });

    it("should return the cart with detailed items and subtotal", async () => {
      await cartService.addItemToCart(testUser.id, generalTicket.id, 2); // 2 * 1000 = 2000
      await cartService.addItemToCart(testUser.id, vipTicket.id, 1); // 1 * 5000 = 5000

      const response = await request(app)
        .get("/api/v1/cart")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.totalItems).toBe(3);
      expect(response.body.subtotal).toBe("70.00"); // (2000 + 5000) / 100
      expect(response.body.items.length).toBe(2);

      const generalItem = response.body.items.find(
        (i: any) => i.ticket_type_id === generalTicket.id
      );
      const vipItem = response.body.items.find(
        (i: any) => i.ticket_type_id === vipTicket.id
      );

      expect(generalItem).toBeDefined();
      expect(generalItem.quantity).toBe(2);
      expect(generalItem.details).toEqual({ name: "General", price: "10.00" });

      expect(vipItem).toBeDefined();
      expect(vipItem.quantity).toBe(1);
      expect(vipItem.details).toEqual({ name: "VIP", price: "50.00" });
    });

    it("should return 401 if user is not authenticated", async () => {
      const response = await request(app).get("/api/v1/cart");
      expect(response.status).toBe(401);
    });
  });
});
