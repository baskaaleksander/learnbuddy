import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { db } from 'src/database/drizzle.module';
import { aiOutputs, materials } from 'src/database/schema';
import { toAIOutputGraphQL } from 'src/mappers/ai-output.mapper';
import { OpenAiService } from 'src/open-ai/open-ai.service';


@Injectable()
export class FlashcardsService {
    constructor(
        @Inject('DRIZZLE') private drizzle: typeof db,
        private readonly openAiService: OpenAiService
    ) {}

    // async getFlashcardsByMaterial(materialId: string, userId: string) {
    //     const materialAccess = await this.drizzle
    //         .select()
    //         .from(materials)
    //         .where(
    //             and(
    //                 eq(materials.id, materialId),
    //                 eq(materials.userId, userId)
    //             )
    //         );
    //     if (materialAccess.length === 0) {
    //         throw new UnauthorizedException('Material not found or access denied');
    //     }

    //     const flashcards = await this.drizzle
    //         .select()
    //         .from(aiOutputs)
    //         .where(
    //             and(
    //                 eq(aiOutputs.materialId, materialId),
    //                 eq(aiOutputs.type, 'flashcards')
    //             )
    //         );

    //     if (flashcards.length === 0) {
    //         throw new NotFoundException('No flashcards found for this material');
    //     }

    //     return flashcards.map(flashcard => toAIOutputGraphQL(flashcard));
    // }
}
