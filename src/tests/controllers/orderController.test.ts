import request from "supertest";
import express, { Express } from "express";
import bcrypt from "bcryptjs";
import { getDataSource } from "../../config/getDataSource";
import { User } from "../../entities/User";
import { Event } from "../../entities/Event";
import { TicketType } from "../../entities/TicketType";
import { Order } from "../../entities/Order";
import { generateToken } from "../../utils/jwt";
import { authenticateToken } from "../../middleware/auth";
import { createOrder } from "../../controllers/orderController";
import * as cartService from "../../services/cartService";
import { DataSource } from "typeorm";

const app: Express = express();
app.use(express.json());

// Mount the route to be tested
app.post("/api/orders", authenticateToken, createOrder);

describe("Order Controller - POST /api/orders", () => {
  const userRepository = getDataSource().getRepository(User);
  const eventRepository = getDataSource().getRepository(Event);
  const ticketTypeRepository = getDataSource().getRepository(TicketType);
  const orderRepository = getDataSource().getRepository(Order);

  const getMockOrderPayload = ({
    generalTicket,
  }: {
    generalTicket: TicketType;
  }) => ({
    tickets: [{ ticket_type_id: generalTicket.id, quantity: 2 }],
    customer_info: {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "1234567890",
    },
    billing_address: {
      address: "123 Main St",
      city: "Anytown",
      state: "CA",
      zipCode: "12345",
    },
    payment_info: {
      lastFour: "4242",
      cardholderName: "John Doe",
    },
  });

  // afterEach(async () => {
  //   // Clean up orders and restore mocks after each test
  //   await orderRepository.delete({});
  //   jest.restoreAllMocks();
  // });

  it("should create an order successfully with a valid request", async () => {
    const {
      token: userToken,

      generalTicket,
    } = await setup(getDataSource());

    const payload = getMockOrderPayload({
      generalTicket,
    });

    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${userToken}`)
      .send(payload);

    expect(response.body).toEqual({
      billingAddress: {
        address: "123 Main St",
        city: "Anytown",
        state: "CA",
        zipCode: "12345",
      },
      createdAt: expect.any(String),
      customerInfo: {
        email: "john.doe@example.com",
        firstName: "John",
        lastName: "Doe",
        phone: "1234567890",
      },
      eventDate: "2024-01-01",
      eventLocation: "Some Location",
      eventName: "Some Event Name",
      id: expect.any(String),
      paymentInfo: {
        cardholderName: "John Doe",
        lastFour: "4242",
      },
      status: "completed",
      tickets: [
        {
          id: expect.any(String),
          name: "General",
          price: 2500,
          quantity: 2,
        },
      ],
      totalAmount: 50,
      updatedAt: expect.any(String),
      userId: expect.any(String),
    });
  });

  // xit("should return 401 if no token is provided", async () => {
  //   const payload = getMockOrderPayload();
  //   const response = await request(app).post("/api/orders").send(payload);

  //   expect(response.status).toBe(401);
  //   expect(response.body.message).toBe("No token provided");
  // });

  // xit("should return 400 for insufficient ticket quantity", async () => {
  //   const payload = getMockOrderPayload({
  //     tickets: [{ ticket_type_id: limitedTicket.id, quantity: 5 }], // Only 3 available
  //   });

  //   const response = await request(app)
  //     .post("/api/orders")
  //     .set("Authorization", `Bearer ${userToken}`)
  //     .send(payload);

  //   expect(response.status).toBe(400);
  //   expect(response.body.message).toContain("Insufficient quantity");
  // });

  // xit("should return 400 for a non-existent ticket type ID", async () => {
  //   const nonExistentId = "00000000-0000-0000-0000-000000000000";
  //   const payload = getMockOrderPayload({
  //     tickets: [{ ticket_type_id: nonExistentId, quantity: 1 }],
  //   });

  //   const response = await request(app)
  //     .post("/api/orders")
  //     .set("Authorization", `Bearer ${userToken}`)
  //     .send(payload);

  //   expect(response.status).toBe(400);
  //   expect(response.body.message).toContain("not found");
  // });
});

async function setup(ds: DataSource) {
  const userRepository = ds.getRepository(User);
  const eventRepository = ds.getRepository(Event);
  const ticketTypeRepository = ds.getRepository(TicketType);

  // Create a test user
  const passwordHash = await bcrypt.hash("orderPass123", 10);
  const testUser = await userRepository.save(
    userRepository.create({
      email: "order.user@example.com" + Date.now(),
      passwordHash,
      role: "user",
    })
  );
  const userToken = generateToken({
    id: testUser.id,
    email: testUser.email,
    role: "user",
  });

  // Create a test event
  const testEvent = await eventRepository.save(
    eventRepository.create({
      title: "Order Test Event",
      date: "2029-01-01",
      venue: "Order Venue",
      location: "Order Location",
      imageUrl: "http://example.com/order.jpg",
      priceRange: "$10-$100",
      categories: ["OrderTest"],
    })
  );

  // Create ticket types
  const generalTicket = await ticketTypeRepository.save(
    ticketTypeRepository.create({
      eventId: testEvent.id,
      name: "General",
      price: 2500, // $25.00 in cents
      quantity: 100,
    })
  );
  const limitedTicket = await ticketTypeRepository.save(
    ticketTypeRepository.create({
      eventId: testEvent.id,
      name: "Limited",
      price: 5000,
      quantity: 3, // Low quantity for testing limits
    })
  );
  return {
    user: testUser,
    token: userToken,
    event: testEvent,
    generalTicket,
    limitedTicket,
  };
}
