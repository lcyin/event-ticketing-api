import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { Event } from "./Event";

@Entity()
export class TicketType {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "event_id" })
  eventId: string;

  @Column()
  name: string;

  @Column("integer")
  price: number;

  @Column({ nullable: true })
  description: string;

  @Column("integer")
  quantity: number;

  @ManyToOne(() => Event, (event) => event.ticketTypes)
  @JoinColumn({ name: "event_id" })
  event: Event;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
