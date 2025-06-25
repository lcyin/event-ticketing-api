import { Request, Response } from "express";
import { getDataSource } from "../config/getDataSource";
import { Order } from "../entities/Order";
import { validate as isValidUUID } from "uuid";
import { TicketType } from "../entities/TicketType";
// Assuming you have a cart service:
import * as cartService from "../services/cartService";
import { buildCreateOrderDto } from "../helpers/build-order.helper";

export const createOrder = async (req: Request, res: Response) => {
  const { tickets, customer_info, billing_address, payment_info } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  // --- Validation (Expand as needed) ---
  if (
    !tickets ||
    !Array.isArray(tickets) ||
    tickets.length === 0 ||
    !customer_info ||
    !billing_address ||
    !payment_info
  ) {
    return res.status(400).json({ message: "Invalid order data" });
  }

  // Basic ticket validation
  for (const ticket of tickets) {
    if (!ticket.ticket_type_id || !ticket.quantity || ticket.quantity <= 0) {
      return res.status(400).json({ message: "Invalid ticket data" });
    }
  }
  // --- End Validation ---

  const queryRunner = getDataSource().createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const orderRepository = queryRunner.manager.getRepository(Order);
    const ticketTypeRepository = queryRunner.manager.getRepository(TicketType);

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

    await queryRunner.commitTransaction();
    return res.status(201).json(savedOrder);
  } catch (error: any) {
    await queryRunner.rollbackTransaction();
    console.error("Error during checkout:", error);
    return res
      .status(400) // Or another appropriate status code
      .json({ message: error.message || "Checkout failed" });
  } finally {
    await queryRunner.release();
  }
};

export const getUserOrderHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId || !isValidUUID(userId)) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { limit = 20, offset = 0 } = req.query;
    const limitNumber = Number(limit);
    const offsetNumber = Number(offset);

    if (isNaN(limitNumber) || limitNumber <= 0 || limitNumber > 100) {
      return res
        .status(400)
        .json({ message: "Invalid limit. Must be between 1 and 100" });
    }

    if (isNaN(offsetNumber) || offsetNumber < 0) {
      return res.status(400).json({ message: "Invalid offset. Must be >= 0" });
    }

    const orderRepository = getDataSource().getRepository(Order);
    const [orders, total] = await orderRepository.findAndCount({
      where: { userId },
      order: { createdAt: "DESC" },
      take: limitNumber,
      skip: offsetNumber,
    });

    return res.status(200).json({
      total,
      limit: limitNumber,
      offset: offsetNumber,
      orders,
    });
  } catch (error) {
    console.error("Error fetching user order history:", error);
    return res
      .status(500)
      .json({ message: "Failed to retrieve order history" });
  }
};
