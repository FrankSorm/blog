import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('comments')
export class CommentEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Index()
  @Column({ type: 'uuid' })
  articleId!: string;

  @Column({ type: 'uuid', nullable: true })
  parentId!: string | null;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  authorName!: string | null;

  @Column({ type: 'int', default: 0 })
  score!: number;

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}

import { Unique } from 'typeorm';

@Entity('comment_votes')
@Unique(['commentId', 'ip'])
export class VoteEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Index()
  @Column({ type: 'uuid' })
  commentId!: string;

  @Column({ type: 'varchar', length: 64 })
  ip!: string;

  @Column({ type: 'int' })
  value!: number; // 1 | -1

  @CreateDateColumn() createdAt!: Date;
}
