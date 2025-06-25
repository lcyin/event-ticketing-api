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
import {
  createOrder,
  getUserOrderHistory,
} from "../../controllers/orderController";
import { DataSource } from "typeorm";
import { buildCreateOrderDto } from "../../helpers/build-order.helper";

const app: Express = express();
app.use(express.json());

// Mount the route to be tested
app.post("/api/orders", authenticateToken, createOrder);
app.get("/api/orders", authenticateToken, getUserOrderHistory);

describe("Order Controller - POST /api/orders", () => {
  it("should create an order successfully with a valid request", async () => {
    const { token: userToken, generalTicket } = await setup(getDataSource());

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
});

describe("Order Controller - GET /api/orders", () => {
  it("should retrieve user's order history successfully", async () => {
    const { token } = await setup(getDataSource());
    const response = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${token}`);

    expect(response.body).toEqual({
      limit: 20,
      offset: 0,
      orders: [
        {
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
          totalAmount: "50.00",
          updatedAt: expect.any(String),
          userId: expect.any(String),
        },
      ],
      total: 1,
    });
  });
});

async function setup(ds: DataSource) {
  const userRepository = ds.getRepository(User);
  const eventRepository = ds.getRepository(Event);
  const ticketTypeRepository = ds.getRepository(TicketType);
  const orderRepository = ds.getRepository(Order);

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
  // Create an order for the test user
  const { tickets, customer_info, billing_address, payment_info, status } =
    getMockOrderPayload({
      generalTicket,
    });
  const orderDto = buildCreateOrderDto({
    userId: testUser.id,
    ticketDetails: tickets.map((ticket) => ({
      id: ticket.ticket_type_id,
      name: generalTicket.name,
      price: generalTicket.price,
      quantity: ticket.quantity,
    })),
    customer_info,
    billing_address,
    payment_info,
    totalAmount: tickets.reduce(
      (total, ticket) => total + generalTicket.price * ticket.quantity,
      0
    ),
  });
  const order = await orderRepository.save<Order>(
    orderRepository.create(orderDto)
  );

  return {
    user: testUser,
    token: userToken,
    event: testEvent,
    generalTicket,
    limitedTicket,
    order,
  };
}

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
  status: "completed",
});
