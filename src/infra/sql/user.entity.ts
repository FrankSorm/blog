import { Entity, PrimaryColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity('users')
export class UserEntity {
  @PrimaryColumn('uuid') id!: string;        // uuid4
  @Index({ unique: true }) @Column({ type: 'varchar', length: 255 }) email!: string;
  @Column({ type: 'varchar', length: 160 }) name!: string;
  @Column({ type: 'varchar', length: 255 }) password!: string;
  @Column({ type: 'varchar', length: 16, default: 'user' }) role!: 'user'|'admin';
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
