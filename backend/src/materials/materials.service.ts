import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { db } from 'src/database/drizzle.module';
import {
  aiOutputs,
  flashcardProgress,
  flashcards,
  materials,
  quizPartials,
  quizResults,
} from 'src/database/schema';
import { toMaterialGraphQL } from './materials.mapper';
import { and, desc, eq, sql } from 'drizzle-orm';
import { CreateMaterialInput } from './dtos/create-material.input';

@Injectable()
export class MaterialsService {
  constructor(@Inject('DRIZZLE') private drizzle: typeof db) {}

  async getAllMaterials() {
    const allMaterials = await this.drizzle.select().from(materials);

    return allMaterials.map((material) => toMaterialGraphQL(material));
  }

  async getUserMaterials(
    userId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt-desc',
    status: 'pending' | 'processed' | 'failed' | 'all' = 'all',
  ) {
    const whereCondition =
      status === 'all'
        ? eq(materials.userId, userId)
        : and(eq(materials.userId, userId), eq(materials.status, status));

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`COUNT(*)` })
      .from(materials)
      .where(whereCondition);

    const totalItems = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    if (totalItems === 0) {
      return {
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: page,
        pageSize: limit,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }

    const userMaterials = await this.drizzle
      .select()
      .from(materials)
      .where(whereCondition)
      .orderBy(
        sortBy === 'createdAt-desc'
          ? desc(materials.createdAt)
          : sortBy === 'createdAt-asc'
            ? materials.createdAt
            : sortBy === 'title-desc'
              ? desc(materials.title)
              : sortBy === 'title-asc'
                ? materials.title
                : sortBy === 'status-desc'
                  ? desc(materials.status)
                  : sortBy === 'status-asc'
                    ? materials.status
                    : desc(materials.createdAt),
      )
      .limit(limit)
      .offset((page - 1) * limit);

    return {
      data: userMaterials.map((material) => toMaterialGraphQL(material)),
      totalItems, // Changed from totalCount to totalItems
      totalPages,
      currentPage: page,
      pageSize: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async getMaterialById(id: string, userId: string) {
    const material = await this.drizzle
      .select()
      .from(materials)
      .where(eq(materials.id, id));

    if (material.length === 0) {
      throw new NotFoundException('Material not found');
    }

    if (material[0].userId !== userId) {
      throw new UnauthorizedException(
        'You do not have permission to access this material',
      );
    }

    return toMaterialGraphQL(material[0]);
  }

  async createMaterial(userId: string, input: CreateMaterialInput) {
    // await this.drizzle
    //     .insert(materials)
    //     .values({
    //         userId: userId,
    //         title: input.title,
    //         content: input.content,
    //         status: 'processed'
    //     })
    //     .catch((err) => {
    //         throw new Error('Error creating material', err);
    //     }
    // );
    //
    // return true;

    const material = await this.drizzle
      .select()
      .from(materials)
      .where(eq(materials.id, input.id));

    if (material.length === 0) {
      throw new NotFoundException('Material with this ID doesnt exist');
    }

    if (material[0].userId !== userId) {
      throw new UnauthorizedException(
        'You do not have permission to create this material',
      );
    }

    if (material[0].status !== 'pending') {
      throw new ConflictException(
        'Material is already processed or failed, try uploading a new one',
      );
    }

    const updatedMaterial = await this.drizzle
      .update(materials)
      .set({
        title: input.title,
        description: input.description,
        status: 'processed',
      })
      .where(eq(materials.id, input.id))
      .returning();

    return toMaterialGraphQL(updatedMaterial[0]);
  }

  async deleteMaterial(userId: string, id: string) {
    const material = await this.drizzle
      .select()
      .from(materials)
      .where(eq(materials.id, id));

    if (material.length === 0) {
      throw new NotFoundException('Material not found');
    }

    if (material[0].userId !== userId) {
      throw new UnauthorizedException(
        'You do not have permission to delete this material',
      );
    }

    const relatedAiOutputs = await this.drizzle
      .select({ id: aiOutputs.id })
      .from(aiOutputs)
      .where(eq(aiOutputs.materialId, id));

    const aiOutputIds = relatedAiOutputs.map((output) => output.id);

    if (aiOutputIds.length > 0) {
      await this.drizzle.delete(flashcardProgress).where(
        sql`${flashcardProgress.flashcardId} IN (
          SELECT ${flashcards.id} FROM ${flashcards} 
          WHERE ${flashcards.aiOutputId} = ANY(${aiOutputIds})
        )`,
      );

      await this.drizzle
        .delete(flashcards)
        .where(sql`${flashcards.aiOutputId} = ANY(${aiOutputIds})`);

      await this.drizzle
        .delete(quizResults)
        .where(sql`${quizResults.aiOutputId} = ANY(${aiOutputIds})`);

      await this.drizzle
        .delete(quizPartials)
        .where(sql`${quizPartials.quizId} = ANY(${aiOutputIds})`);

      await this.drizzle.delete(aiOutputs).where(eq(aiOutputs.materialId, id));
    }

    await this.drizzle
      .delete(quizResults)
      .where(eq(quizResults.materialId, id));

    await this.drizzle.delete(materials).where(eq(materials.id, id));

    return true;
  }
}
