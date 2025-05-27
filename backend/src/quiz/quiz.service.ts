import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { db } from 'src/database/drizzle.module';
import { aiOutputs, materials } from 'src/database/schema';

@Injectable()
export class QuizService {
    constructor(@Inject('DRIZZLE') private drizzle: typeof db) {}

    async getQuizesByMaterial(materialId: string, userId: string) {

        const materialAccess = await this.drizzle
            .select()
            .from(materials)
            .where(
                and(
                    eq(materials.id, materialId),
                    eq(materials.userId, userId)
                )
            );
        if (materialAccess.length === 0) {
            throw new Error('Material not found or access denied');
        }

        const quizes = await this.drizzle
            .select()
            .from(aiOutputs)
            .where(
                and(
                    eq(aiOutputs.materialId, materialId),
                    eq(aiOutputs.type, 'quiz')
                )
            );
            

    }

    
}
