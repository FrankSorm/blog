import { Entity, PrimaryColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity('articles')
export class ArticleEntity {
  @PrimaryColumn('uuid') id!: string; // uuid
  @Column({ type: 'varchar', length: 180 }) title!: string;
  @Index({ unique: true }) @Column({ type: 'varchar', length: 220 }) slug!: string;
  @Column({ type: 'text' }) content!: string;
  @Column({ type: 'text', nullable: true }) excerpt!: string | null;
  @Column('simple-array', { nullable: true }) tags!: string[] | null;
  @Column('simple-array', { nullable: true }) categories!: string[] | null;
  @Column({ type: 'varchar', length: 16, default: 'draft' }) status!: 'draft'|'published'|'scheduled';
  @Column({ type: 'timestamptz', nullable: true }) publishAt!: Date | null;
  @Column({ type: 'varchar', length: 400, nullable: true }) coverImage!: string | null;
  @Column({ type: 'int', default: 0 }) views!: number;
  @Column({ type: 'uuid' }) authorId!: string; // uuid of user
  @Column({ type: 'timestamptz', nullable: true }) deletedAt!: Date | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
@Entity('article_images')
export class ArticleImageEntity {
  @PrimaryColumn('uuid') id!: string;
  @Column({ type: 'uuid' }) articleId!: string;
  @Column({ type: 'varchar', length: 255 }) filename!: string;
  @Column({ type: 'varchar', length: 400 }) url!: string;
  @Column({ type: 'varchar', length: 255, nullable: true }) alt!: string | null;
}
