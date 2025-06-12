import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { db } from 'src/database/drizzle.module';
import { materials } from 'src/database/schema';
import { toMaterialGraphQL } from './materials.mapper';
import { eq, sql } from 'drizzle-orm';
import { CreateMaterialInput } from './dtos/create-material.input';

@Injectable()
export class MaterialsService {
  constructor(@Inject('DRIZZLE') private drizzle: typeof db) {}

  async getAllMaterials() {
    const allMaterials = await this.drizzle.select().from(materials);

    return allMaterials.map((material) => toMaterialGraphQL(material));
  }

  async getUserMaterials(userId: string, page: number = 1, limit: number = 10) {
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`COUNT(*)` })
      .from(materials)
      .where(eq(materials.userId, userId));

    const totalCount = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    const userMaterials = await this.drizzle
      .select()
      .from(materials)
      .where(eq(materials.userId, userId))
      .limit(limit)
      .offset((page - 1) * limit);

    if (userMaterials.length === 0) {
      return [];
    }

    return {
      data: userMaterials.map((material) => toMaterialGraphQL(material)),
      totalCount,
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

    await this.drizzle.delete(materials).where(eq(materials.id, id));

    return true;
  }
}
