import { Request, Response } from "express";
import * as orderService from "../services/orderService";
import { getDataSource } from "../config/getDataSource";

export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id; // Non-null assertion: auth middleware ensures user
    const savedOrder = await orderService.createOrder(
      getDataSource(),
      userId,
      req.body
    );
    return res.status(201).json(savedOrder);
  } catch (error: any) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
};

export const getUserOrderHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id; // Non-null assertion: auth middleware ensures user
    const { limit = 20, offset = 0 } = req.query;
    const limitNumber = Number(limit);
    const offsetNumber = Number(offset);
    const result = await orderService.getUserOrderHistory(
      getDataSource(),
      userId,
      limitNumber,
      offsetNumber
    );
    return res.status(200).json(result);
  } catch (error: any) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const user = req.user!;
    const order = await orderService.getOrderById(
      getDataSource(),
      orderId,
      user
    );
    return res.status(200).json(order);
  } catch (error: any) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
};
