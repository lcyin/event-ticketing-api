import { IEvent } from "../types/event.type";

export function validateCreateEventData(eventData: any): IEvent {
  const {
    title,
    date,
    start_time,
    end_time,
    venue,
    location,
    image_url,
    price_range,
    categories,
  } = eventData;

  if (!title || typeof title !== "string") {
    throw new Error("Title is required and must be a string.");
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Date is required in YYYY-MM-DD format.");
  }
  if (start_time && !/^\d{2}:\d{2}$/.test(start_time)) {
    throw new Error("Start time must be in HH:MM format.");
  }
  if (end_time && !/^\d{2}:\d{2}$/.test(end_time)) {
    throw new Error("End time must be in HH:MM format.");
  }
  if (!venue || typeof venue !== "string") {
    throw new Error("Venue is required and must be a string.");
  }
  if (!location || typeof location !== "string") {
    throw new Error("Location is required and must be a string.");
  }
  if (!image_url || typeof image_url !== "string") {
    throw new Error("Image URL is required and must be a string.");
  }
  if (!price_range || typeof price_range !== "string") {
    throw new Error("Price range is required and must be a string.");
  }
  if (
    !categories ||
    !Array.isArray(categories) ||
    categories.length === 0 ||
    !categories.every((cat) => typeof cat === "string")
  ) {
    throw new Error("Categories are required as a non-empty array of strings.");
  }
  return {
    title,
    description: eventData.description,
    longDescription: eventData.long_description,
    date,
    startTime: start_time,
    endTime: eventData.end_time,
    venue,
    location,
    address: eventData.address,
    organizer: eventData.organizer,
    imageUrl: image_url,
    priceRange: price_range,
    categories,
    status: eventData.status || "draft", // Default to 'draft' if not provided
  };
}
