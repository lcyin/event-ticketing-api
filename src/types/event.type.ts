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

export interface IGetPublicEventsQuery {
  q?: string;
  category?: string;
  date?: string;
  page?: string;
  limit?: string;
}
