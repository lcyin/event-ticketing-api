import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'event_name' })
  eventName: string;

  @Column({ name: 'event_date' })
  eventDate: string;

  @Column({ name: 'event_location' })
  eventLocation: string;

  @Column('jsonb')
  tickets: any[];

  @Column('jsonb', { name: 'customer_info' })
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };

  @Column('jsonb', { name: 'billing_address' })
  billingAddress: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };

  @Column('jsonb', { name: 'payment_info' })
  paymentInfo: {
    lastFour: string;
    cardholderName: string;
  };

  @Column('decimal', { precision: 10, scale: 2, name: 'total_amount' })
  totalAmount: number;

  @Column()
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 