import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { db } from 'src/database/drizzle.module';
import { aiOutputs, flashcardProgress, flashcards, materials } from 'src/database/schema';
import { OpenAiService } from 'src/open-ai/open-ai.service';
import { toFlashcardGraphQL } from './flashcard.mapper';
import { FlashcardProgressStatus } from './flashcard-progress.graphql';


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
        
        const dbFlashcards = await Promise.all(
            generatedFlashcards.flashcards.map(async (flashcard) => {
                const inserted = await this.drizzle
                    .insert(flashcards)
                    .values({
                        aiOutputId: aiOutput[0].id,
                        question: flashcard.pytanie,
                        answer: flashcard.odpowiedz,
                        createdAt: new Date(),
                    })
                    .returning();
                return inserted[0];
            })
        );

        await Promise.all(
            dbFlashcards.map(async (flashcard) => {
                await this.drizzle
                    .insert(flashcardProgress)
                    .values({
                        flashcardId: flashcard.id,
                        userId: userId,
                        status: FlashcardProgressStatus.review,
                    });
            })
        );

        return true;
    }

    async getFlashcardById(id: string, userId: string) {
        const flashcard = await this.drizzle
            .select()
            .from(flashcards)
            .where(eq(flashcards.id, id));

        if (flashcard.length === 0) {
            throw new NotFoundException('Flashcard not found');
        }

        return toFlashcardGraphQL(flashcard[0]);
    }

    async deleteFlashcards(id: string, userId: string) {
    }

    async updateFlashcardStatus(id: string, userId: string, status: FlashcardProgressStatus){
        const flashcardProgressEntry = await this.drizzle
            .select()
            .from(flashcardProgress)
            .where(
                and(
                    eq(flashcardProgress.flashcardId, id),
                    eq(flashcardProgress.userId, userId)
                )
            );
            
        if (flashcardProgressEntry.length === 0) {
            throw new NotFoundException('Flashcard progress not found');
        }

        await this.drizzle
            .update(flashcardProgress)
            .set({ status: status })
            .where(
                and(
                    eq(flashcardProgress.flashcardId, id),
                    eq(flashcardProgress.userId, userId)
                )
            );

        return true;
    }
}
