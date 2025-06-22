import { Request, Response } from "express";
import { validate as isValidUUID } from "uuid";
import * as cartService from "../services/cartService";

export const addItemToCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      // This should technically be caught by middleware, but as a safeguard:
      return res.status(401).json({ error: "User not authenticated." });
    }

    const { ticket_type_id, quantity } = req.body;

    // --- Validation ---
    if (!ticket_type_id || !isValidUUID(ticket_type_id)) {
      return res
        .status(400)
        .json({ error: "Invalid input: ticket_type_id is required." });
    }
    if (!quantity || typeof quantity !== "number" || quantity <= 0) {
      return res
        .status(400)
        .json({ error: "Invalid input: quantity must be a positive integer." });
    }
    // --- End Validation ---

    const updatedCart = await cartService.addItemToCart(
      userId,
      ticket_type_id,
      quantity
    );

    return res.status(200).json(updatedCart);
  } catch (error: any) {
    // Handle errors thrown from the service layer
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error("Error adding item to cart:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getCartContents = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      // This should technically be caught by middleware, but as a safeguard:
      return res.status(401).json({ error: "User not authenticated." });
    }

    const cartContents = await cartService.getCartContents(userId);

    return res.status(200).json(cartContents);
  } catch (error: any) {
    console.error("Error getting cart contents:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
