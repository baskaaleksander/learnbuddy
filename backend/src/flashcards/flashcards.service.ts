import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { db } from 'src/database/drizzle.module';
import { aiOutputs, flashcards, materials } from 'src/database/schema';
import { OpenAiService } from 'src/open-ai/open-ai.service';
import { toFlashcardGraphQL } from './flashcard.mapper';


@Injectable()
export class FlashcardsService {
    constructor(
        @Inject('DRIZZLE') private drizzle: typeof db,
        private readonly openAiService: OpenAiService
    ) {}

    async getFlashcardsByMaterial(materialId: string, userId: string) {
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
            throw new UnauthorizedException('Material not found or access denied');
        }

        const aiOutput = await this.drizzle
            .select()
            .from(aiOutputs)
            .where(
                and(
                    eq(aiOutputs.materialId, materialId),
                    eq(aiOutputs.type, 'flashcards')
                )
            );

        if (aiOutput.length === 0) {
            throw new NotFoundException('No flashcards found for this material');
        }

        const flashcardsArr = await this.drizzle
            .select()
            .from(flashcards)
            .where(eq(flashcards.aiOutputId, aiOutput[0].id));


        return flashcardsArr.map(flashcard => toFlashcardGraphQL(flashcard));
    }

    async createFlashcards(materialId: string, userId: string) {
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
            throw new UnauthorizedException('Material not found or access denied');
        }

        const generatedFlashcards = await this.openAiService.generateFlashcards(materialId);
        if (!generatedFlashcards) {
            throw new NotFoundException('No flashcards generated for this material');
        }

        const aiOutput = await this.drizzle
            .insert(aiOutputs)
            .values({
                materialId: materialId,
                type: 'flashcards',
                content: flashcards,
                createdAt: new Date(),
            })
            .returning();
        
        await generatedFlashcards.flashcards.map(async (flashcard) => {
            await this.drizzle
                .insert(flashcards)
                .values({
                    aiOutputId: aiOutput[0].id,
                    question: flashcard.pytanie,
                    answer: flashcard.odpowiedz,
                    createdAt: new Date(),
                });
        })

        return true;
    }
}
