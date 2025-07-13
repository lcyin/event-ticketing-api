import { Request } from "express";

interface CreateTicketTypeData {
  name: string;
  price: number;
  description?: string;
  quantity: number;
}

export const validateCreateTicketTypeData = (body: any): CreateTicketTypeData => {
  const { name, price, description, quantity } = body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    throw new Error("Ticket type name is required and must be a non-empty string.");
  }
  if (price === undefined || typeof price !== "number" || price < 0) {
    throw new Error("Price is required and must be a non-negative number.");
  }
  if (quantity === undefined || typeof quantity !== "number" || quantity < 0) {
    throw new Error("Quantity is required and must be a non-negative number.");
  }
  if (description && typeof description !== "string") {
    throw new Error("Description must be a string.");
  }

  return { name, price, description, quantity };
};
