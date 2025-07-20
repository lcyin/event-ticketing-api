import { Request, Response } from "express";
import { getDataSource } from "../config/getDataSource";
import * as eventService from "../services/eventService";

export const getPublicEvents = async (req: Request, res: Response) => {
  try {
    const result = await eventService.getPublicEvents(getDataSource(), req.query);
    return res.status(200).json(result);
  } catch (error: any) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
};

export const getPublicEventById = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const event = await eventService.getPublicEventById(getDataSource(), eventId);
    return res.status(200).json(event);
  } catch (error: any) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Internal server error" });
  }
};
