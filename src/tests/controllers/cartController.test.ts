import request from "supertest";
import express, { Express, NextFunction } from "express";
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
import { DataSource } from "typeorm";

const app: Express = express();
app.use(express.json());
const mockMiddleware = (req: any, res: any, next: any) => {
  req.user = req.query.user;
  next();
};
// Mount the cart route with authentication middleware
app.post("/api/v1/cart/items", mockMiddleware as any, addItemToCart);
app.get("/api/v1/cart", mockMiddleware as any, getCartContents);

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
        .query({ user: testUser }) // Mock user authentication
        .send({ ticket_type_id: generalTicket.id, quantity: 2 });

      expect(response.body).toEqual({
        items: [
          {
            quantity: 2,
            ticket_type_id: expect.any(String), // UUID format
          },
        ],
        totalItems: 2,
      });
    });
  });

  describe("GET /api/v1/cart", () => {
    it("should return an empty cart for a user with no items", async () => {
      const response = await request(app)
        .get("/api/v1/cart")
        .query({ user: testUser }); // Mock user authentication
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        items: [],
        totalItems: 0,
        subtotal: "0.00",
      });
    });
  });
});
