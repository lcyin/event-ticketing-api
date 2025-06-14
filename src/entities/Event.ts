import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { TicketType } from "./TicketType";
import { FAQ } from "./FAQ";

@Entity()
export class Event {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true, name: "long_description" })
  longDescription: string;

  @Column()
  date: string;

  @Column({ nullable: true, name: "start_time" })
  startTime: string;

  @Column({ nullable: true, name: "end_time" })
  endTime: string;

  @Column()
  venue: string;

  @Column()
  location: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  organizer: string;

  @Column({ name: "image_url" })
  imageUrl: string;

  @Column({ name: "price_range" })
  priceRange: string;

  @Column("simple-array")
  categories: string[];

  @Column({ type: "varchar", length: 50, default: "draft" }) // e.g., draft, published, archived
  status: string;

  @OneToMany(() => TicketType, (ticketType) => ticketType.event)
  ticketTypes: TicketType[];

  @OneToMany(() => FAQ, (faq) => faq.event)
  faqs: FAQ[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
