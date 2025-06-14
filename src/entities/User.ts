import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from "typeorm";

@Entity()
@Unique(["email"])
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  email: string;

  @Column()
  passwordHash: string;

  @Column({ type: "varchar", nullable: true, default: null })
  firstName: string | null;

  @Column({ type: "varchar", nullable: true, default: null })
  lastName: string | null;

  @Column({ type: "varchar", length: 50, default: "user" })
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
