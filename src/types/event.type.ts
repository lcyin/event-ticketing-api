export interface IEvent {
  title: string;
  description?: string;
  longDescription?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  venue: string;
  location: string;
  address?: string;
  organizer?: string;
  imageUrl: string;
  priceRange: string;
  categories: string[];
  status?: "draft" | "published" | "cancelled";
}
