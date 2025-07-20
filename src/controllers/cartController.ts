import { Request, Response } from "express";
import * as cartService from "../services/cartService";
import { getDataSource } from "../config/getDataSource";

export const addItemToCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id; // Non-null assertion: auth middleware ensures user
    const updatedCart = await cartService.addItemToCart(
      getDataSource(),
      userId,
      req.body
    );
    return res.status(200).json(updatedCart);
  } catch (error: any) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
};

export const getCartContents = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id; // Non-null assertion: auth middleware ensures user
    const cartContents = await cartService.getCartContents(
      getDataSource(),
      userId
    );
    return res.status(200).json(cartContents);
  } catch (error: any) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
};
