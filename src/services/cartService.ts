import { In } from "typeorm";
import { getDataSource } from "../config/getDataSource";
import { TicketType } from "../entities/TicketType";

/**
 * This is a simple in-memory cart store.
 * In a production environment, this should be replaced with a more persistent
 * and scalable solution like Redis or a dedicated database table.
 */

export interface CartItem {
  ticket_type_id: string;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
}
export interface CartItemWithDetails extends CartItem {
  details: {
    name: string;
    price: string; // e.g., "55.00"
  };
}

export interface DetailedCart {
  items: CartItemWithDetails[];
  totalItems: number;
  subtotal: string; // e.g., "110.00"
}
const carts: { [userId: string]: Cart } = {};

/**
 * Retrieves the cart for a given user.
 * @param userId The ID of the user.
 * @returns The user's cart.
 */
export const getCart = (userId: string): Cart => {
  if (!carts[userId]) {
    carts[userId] = { items: [], totalItems: 0 };
  }
  return carts[userId];
};

/**
 * Retrieves the cart for a given user with detailed item information.
 * @param userId The ID of the user.
 * @returns The user's cart with details and subtotal.
 */
export const getCartContents = async (
  userId: string
): Promise<DetailedCart> => {
  const cart = getCart(userId);
  if (cart.items.length === 0) {
    return { items: [], totalItems: 0, subtotal: "0.00" };
  }

  const ticketTypeRepository = getDataSource().getRepository(TicketType);
  const ticketTypeIds = cart.items.map((item) => item.ticket_type_id);

  // Fetch all needed ticket types in one query
  const ticketTypes = await ticketTypeRepository.find({
    where: { id: In(ticketTypeIds) },
  });
  const ticketTypeData = ticketTypes.map((ticketType) => {
    return {
      ...ticketType,
      price: ticketType.price / 100, // Convert price from cents to dollars
      priceTotal: ticketType.price * ticketType.quantity,
    };
  });
  const ticketTypeMap = new Map(ticketTypes.map((tt) => [tt.id, tt]));

  let subtotal = 0;
  const detailedItems: CartItemWithDetails[] = [];

  for (const item of cart.items) {
    const ticketType = ticketTypeMap.get(item.ticket_type_id);
    if (ticketType) {
      const itemPrice = ticketType.price; // price is in cents
      subtotal += itemPrice * item.quantity;
      detailedItems.push({
        ...item,
        details: {
          name: ticketType.name,
          price: (itemPrice / 100).toFixed(2),
        },
      });
    }
  }

  return {
    items: detailedItems,
    totalItems: cart.totalItems,
    subtotal: (subtotal / 100).toFixed(2),
  };
};

/**
 * Adds an item to a user's cart, or updates its quantity if it already exists.
 * @param userId The ID of the user.
 * @param ticketTypeId The ID of the ticket type to add.
 * @param quantity The quantity to add.
 * @returns The updated cart.
 * @throws An error if the ticket type is not found or if there is insufficient quantity.
 */
export const addItemToCart = async (
  userId: string,
  ticketTypeId: string,
  quantity: number
): Promise<Cart> => {
  const ticketTypeRepository = getDataSource().getRepository(TicketType);
  const ticketType = await ticketTypeRepository.findOneBy({ id: ticketTypeId });

  if (!ticketType) {
    const error = new Error("Ticket type not found.");
    (error as any).statusCode = 404;
    throw error;
  }

  const cart = getCart(userId);
  const existingItem = cart.items.find(
    (item) => item.ticket_type_id === ticketTypeId
  );
  const existingQuantity = existingItem ? existingItem.quantity : 0;
  const requestedTotalQuantity = existingQuantity + quantity;

  if (ticketType.quantity < requestedTotalQuantity) {
    const error = new Error(
      `Not enough tickets available for ticket_type_id ${ticketTypeId}`
    );
    (error as any).statusCode = 400;
    throw error;
  }

  if (existingItem) {
    existingItem.quantity = requestedTotalQuantity;
  } else {
    cart.items.push({ ticket_type_id: ticketTypeId, quantity });
  }

  // Recalculate total items
  cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return cart;
};

/**
 * Clears a user's cart.
 * @param userId The ID of the user whose cart should be cleared.
 */
export const clearCart = (userId: string): void => {
  if (carts[userId]) {
    delete carts[userId];
  }
};
