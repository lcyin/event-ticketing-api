import { OrderStatus } from "../types/order.type";

export const buildCreateOrderDto = ({
  userId,
  ticketDetails,
  customer_info,
  billing_address,
  payment_info,
  totalAmount,
}: {
  userId: string;
  ticketDetails: any[];
  customer_info: any;
  billing_address: any;
  payment_info: any;
  totalAmount: number;
}): {
  userId: string;
  tickets: any[];
  customerInfo: any;
  billingAddress: any;
  paymentInfo: any;
  totalAmount: number;
  status: OrderStatus; // e.g., "completed", "pending"
  eventName: string; // You need to derive these from the ticket details.
  eventDate: string;
  eventLocation: string;
} => {
  return {
    userId,
    tickets: ticketDetails, // Store ticket details in the order
    customerInfo: customer_info,
    billingAddress: billing_address,
    paymentInfo: payment_info,
    totalAmount: totalAmount / 100, // Assuming prices are in cents, store in dollars.
    status: "completed", // Or 'pending' if you have further processing
    eventName: "Some Event Name", // You need to derive these from the ticket details.
    eventDate: "2024-01-01",
    eventLocation: "Some Location",
  };
};
