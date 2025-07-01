import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Order } from "./Order";
import { TicketType } from "./TicketType";

/**
 * Represents an item within an order, linking a specific ticket type
 * with a quantity and the price at the time of purchase.
 */
@Entity("order_item")
export class OrderItem {
  /**
   * The unique identifier for the order item.
   */
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /**
   * The order this item belongs to.
   */
  @ManyToOne(() => Order, (order) => order.orderItems, {
    nullable: false,
    onDelete: "CASCADE", // If an order is deleted, its items are also deleted.
  })
  @JoinColumn({ name: "order_id" })
  order: Order;

  /**
   * The type of ticket for this order item.
   */
  @ManyToOne(() => TicketType, {
    nullable: false,
    onDelete: "RESTRICT", // Prevents deleting a ticket type if it's part of an order.
  })
  @JoinColumn({ name: "ticket_type_id" })
  ticketType: TicketType;

  /**
   * The number of tickets of this type purchased in this order item.
   */
  @Column("integer")
  quantity: number;

  /**
   * The price of a single ticket at the time of purchase.
   * Stored to preserve the historical price.
   */
  @Column("decimal", {
    precision: 10,
    scale: 2,
    name: "price_at_purchase",
  })
  priceAtPurchase: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
