export type OrderStatus = "pending" | "completed" | "cancelled";

export interface ICreateOrder {
  tickets: {
    ticket_type_id: string;
    quantity: number;
  }[];
  customer_info: any; // Define a proper type for this
  billing_address: any; // Define a proper type for this
  payment_info: any; // Define a proper type for this
}
