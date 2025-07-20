import { getDataSource } from "../config/getDataSource";
import { Order } from "../entities/Order";
import { TicketType } from "../entities/TicketType";
import { ICreateOrder } from "../types/order.type";
import * as cartService from "./cartService";
import { buildCreateOrderDto } from "../helpers/build-order.helper";
import { validate as isValidUUID } from "uuid";
import { DataSource } from "typeorm";

export const createOrder = async (
  ds: DataSource,
  userId: string,
  orderData: ICreateOrder
) => {
  const { tickets, customer_info, billing_address, payment_info } = orderData;

  // --- Validation (Expand as needed) ---
  if (
    !tickets ||
    !Array.isArray(tickets) ||
    tickets.length === 0 ||
    !customer_info ||
    !billing_address ||
    !payment_info
  ) {
    const error = new Error("Invalid order data");
    (error as any).statusCode = 400;
    throw error;
  }

  // Basic ticket validation
  for (const ticket of tickets) {
    if (!ticket.ticket_type_id || !ticket.quantity || ticket.quantity <= 0) {
      const error = new Error("Invalid ticket data");
      (error as any).statusCode = 400;
      throw error;
    }
  }
  // --- End Validation ---

  try {
    const savedOrder = await ds.transaction(async (tem) => {
      const orderRepository = tem.getRepository(Order);
      const ticketTypeRepository = tem.getRepository(TicketType);
      // 1. Validate cart and calculate total amount
      let totalAmount = 0;
      const ticketDetails = [];

      for (const ticket of tickets) {
        const ticketType = await ticketTypeRepository.findOneBy({
          id: ticket.ticket_type_id,
        });

        if (!ticketType) {
          throw new Error(`Ticket type ${ticket.ticket_type_id} not found`);
        }

        if (ticketType.quantity < ticket.quantity) {
          throw new Error(
            `Insufficient quantity for ticket type ${ticket.ticket_type_id}`
          );
        }

        totalAmount += ticketType.price * ticket.quantity;
        ticketDetails.push({
          id: ticketType.id,
          name: ticketType.name,
          price: ticketType.price,
          quantity: ticket.quantity,
          // Add other relevant details as needed
        });
      }

      // 2. Process Payment (Mock for now, integrate with payment gateway)
      // In a real application, you'd use a payment gateway here.
      // For this example, we'll just simulate a successful payment.
      const paymentSuccessful = true; // Replace with actual payment processing

      if (!paymentSuccessful) {
        throw new Error("Payment processing failed");
      }

      // 3. Create Order record
      const newOrder = orderRepository.create(
        buildCreateOrderDto({
          userId,
          ticketDetails,
          customer_info,
          billing_address,
          payment_info,
          totalAmount,
        })
      );

      const savedOrder = await orderRepository.save(newOrder);

      // 4. Decrement ticket quantities
      for (const ticket of tickets) {
        await ticketTypeRepository.decrement(
          { id: ticket.ticket_type_id },
          "quantity",
          ticket.quantity
        );
      }

      // 5. Clear the user's cart (if you have a cart system)
      cartService.clearCart(userId);
      return savedOrder;
    });

    return savedOrder;
  } catch (error: any) {
    throw error;
  }
};

export const getUserOrderHistory = async (
  ds: DataSource,
  userId: string,
  limit: number,
  offset: number
) => {
  if (!userId || !isValidUUID(userId)) {
    const error = new Error("User not authenticated");
    (error as any).statusCode = 401;
    throw error;
  }

  if (isNaN(limit) || limit <= 0 || limit > 100) {
    const error = new Error("Invalid limit. Must be between 1 and 100");
    (error as any).statusCode = 400;
    throw error;
  }

  if (isNaN(offset) || offset < 0) {
    const error = new Error("Invalid offset. Must be >= 0");
    (error as any).statusCode = 400;
    throw error;
  }

  const orderRepository = ds.getRepository(Order);
  const [orders, total] = await orderRepository.findAndCount({
    where: { userId },
    order: { createdAt: "DESC" },
    take: limit,
    skip: offset,
  });

  return { total, limit, offset, orders };
};

export const getOrderById = async (
  ds: DataSource,
  orderId: string,
  user: any
) => {
  if (!user?.id) {
    const error = new Error("User not authenticated");
    (error as any).statusCode = 401;
    throw error;
  }

  if (!isValidUUID(orderId)) {
    const error = new Error("Invalid order ID format.");
    (error as any).statusCode = 400;
    throw error;
  }

  const orderRepository = ds.getRepository(Order);

  const order = await orderRepository.findOneBy({ id: orderId });

  if (!order || (user.role !== "admin" && order.userId !== user.id)) {
    const error = new Error("Order not found.");
    (error as any).statusCode = 404;
    throw error;
  }

  return order;
};
