import { Entity, PrimaryColumn, Column, Index, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

@Entity('comments')
export class CommentEntity {
  @PrimaryColumn('uuid') id!: string;
  @Index() @Column('uuid') articleId!: string;
  @Column('uuid', { nullable: true }) parentId!: string | null;
  @Column('text') content!: string;
  @Column({ type: 'varchar', length: 120, nullable: true }) authorName!: string | null;
  @Column('int', { default: 0 }) score!: number;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}

@Entity('comment_votes')
@Unique(['commentId','ip'])
export class VoteEntity {
  @PrimaryColumn('uuid') id!: string;
  @Index() @Column('uuid') commentId!: string;
  @Column({ type: 'varchar', length: 64 }) ip!: string;
  @Column('int') value!: number; // 1 | -1
  @CreateDateColumn() createdAt!: Date;
}
