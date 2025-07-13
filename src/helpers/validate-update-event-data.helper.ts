import { Event } from "../entities/Event";

type UpdateEventData = Partial<Event>;

export const validateUpdateEventData = (updates: any): UpdateEventData => {
  const validatedUpdates: UpdateEventData = {};

  if (
    updates.title !== undefined &&
    (typeof updates.title !== "string" || updates.title.trim() === "")
  ) {
    throw new Error("Title must be a non-empty string.");
  } else if (updates.title !== undefined) {
    validatedUpdates.title = updates.title;
  }

  if (
    updates.date !== undefined &&
    !/^\d{4}-\d{2}-\d{2}$/.test(updates.date)
  ) {
    throw new Error("Date must be in YYYY-MM-DD format.");
  } else if (updates.date !== undefined) {
    validatedUpdates.date = updates.date;
  }

  if (
    updates.start_time !== undefined &&
    updates.start_time !== null &&
    !/^\d{2}:\d{2}$/.test(updates.start_time)
  ) {
    throw new Error("Start time must be in HH:MM format or null.");
  } else if (updates.start_time !== undefined) {
    validatedUpdates.startTime = updates.start_time;
  }

  if (
    updates.end_time !== undefined &&
    updates.end_time !== null &&
    !/^\d{2}:\d{2}$/.test(updates.end_time)
  ) {
    throw new Error("End time must be in HH:MM format or null.");
  } else if (updates.end_time !== undefined) {
    validatedUpdates.endTime = updates.end_time;
  }

  if (
    updates.categories !== undefined &&
    (!Array.isArray(updates.categories) ||
      updates.categories.length === 0 ||
      !updates.categories.every((cat: any) => typeof cat === "string"))
  ) {
    throw new Error("Categories must be a non-empty array of strings.");
  } else if (updates.categories !== undefined) {
    validatedUpdates.categories = updates.categories;
  }

  const stringFields: (keyof Event)[] = [
    "description",
    "longDescription",
    "venue",
    "location",
    "address",
    "organizer",
    "imageUrl",
    "priceRange",
    "status",
  ];

  for (const field of stringFields) {
    const snakeCaseField = field.replace(
      /[A-Z]/g,
      (letter) => `_${letter.toLowerCase()}`
    );
    if (
      updates[snakeCaseField] !== undefined &&
      updates[snakeCaseField] !== null &&
      typeof updates[snakeCaseField] !== "string"
    ) {
      throw new Error(`${field} must be a string or null.`);
    } else if (updates[snakeCaseField] !== undefined) {
      (validatedUpdates as any)[field] = updates[snakeCaseField];
    }
  }

  const {
    long_description,
    start_time,
    end_time,
    image_url,
    price_range,
    ...otherUpdates
  } = updates;
  const mappedUpdates: Partial<Event> = { ...otherUpdates };
  if (long_description !== undefined)
    mappedUpdates.longDescription = long_description;
  if (start_time !== undefined) mappedUpdates.startTime = start_time;
  if (end_time !== undefined) mappedUpdates.endTime = end_time;
  if (image_url !== undefined) mappedUpdates.imageUrl = image_url;
  if (price_range !== undefined) mappedUpdates.priceRange = price_range;

  return mappedUpdates;
};
