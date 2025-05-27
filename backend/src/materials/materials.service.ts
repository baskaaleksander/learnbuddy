import { Inject, Injectable } from '@nestjs/common';
import { db } from 'src/database/drizzle.module';
import { materials, materialStatusEnum } from 'src/database/schema';
import { toMaterialGraphQL } from './materials.mapper';
import { eq } from 'drizzle-orm';
import { CreateMaterialInput } from './dtos/create-material.input';

@Injectable()
export class MaterialsService {

    constructor(@Inject('DRIZZLE') private drizzle: typeof db) {}

    async getAllMaterials() {
        const allMaterials = await this.drizzle.select().from(materials);

        return allMaterials.map(material => (toMaterialGraphQL(material)));
    }

    async getUserMaterials(userId: string) {
        const userMaterials = await this.drizzle.select().from(materials).where(eq(materials.userId, userId));

        if (userMaterials.length === 0) {
            throw new Error('No materials found for this user');
        }

        return userMaterials.map(material => (toMaterialGraphQL(material)));
    }

    async createMaterial(userId: string, input: CreateMaterialInput) {
        const newMaterial = await this.drizzle
            .insert(materials)
            .values({
                userId: userId,
                title: input.title,
                content: input.content,
                status: 'pending'
            })
            .returning()
            .catch((err) => {
                throw new Error('Error creating material', err);
            }
        );
        
        return toMaterialGraphQL(newMaterial[0]);
        
    }
}
