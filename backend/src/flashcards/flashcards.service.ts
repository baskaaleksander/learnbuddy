import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from 'src/database/drizzle.module';
import {
  aiOutputs,
  flashcardProgress,
  flashcards,
  materials,
} from 'src/database/schema';
import { OpenAiService } from 'src/open-ai/open-ai.service';
import { toFlashcardGraphQL } from './graphql/flashcard.mapper';
import { FlashcardProgressStatus } from './graphql/flashcard-progress.graphql';
import { toAIOutputGraphQL } from '../mappers/ai-output.mapper';
import { toMaterialGraphQL } from '../materials/graphql/materials.mapper';
import { BillingService } from 'src/billing/billing.service';

@Injectable()
export class FlashcardsService {
  constructor(
    @Inject('DRIZZLE') private drizzle: typeof db,
    private readonly openAiService: OpenAiService,
    private readonly billingService: BillingService,
  ) {}

  async getFlashcardsByMaterial(materialId: string, userId: string) {
    const materialAccess = await this.drizzle
      .select()
      .from(materials)
      .where(and(eq(materials.id, materialId), eq(materials.userId, userId)));
    if (materialAccess.length === 0) {
      throw new UnauthorizedException('Material not found or access denied');
    }

    const aiOutput = await this.drizzle
      .select()
      .from(aiOutputs)
      .where(
        and(
          eq(aiOutputs.materialId, materialId),
          eq(aiOutputs.type, 'flashcards'),
        ),
      );

    if (aiOutput.length === 0) {
      throw new NotFoundException('No flashcards found for this material');
    }

    const flashcardsArr = await this.drizzle
      .select()
      .from(flashcards)
      .where(eq(flashcards.aiOutputId, aiOutput[0].id));

    return flashcardsArr.map((flashcard) => toFlashcardGraphQL(flashcard));
  }

  async getFlashcardsSetsByUser(
    userId: string,
    page: number = 1,
    pageSize: number = 10,
    sortBy: string = 'createdAt-desc',
  ) {
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`COUNT(*)` })
      .from(aiOutputs)
      .innerJoin(materials, eq(aiOutputs.materialId, materials.id))
      .where(
        and(eq(materials.userId, userId), eq(aiOutputs.type, 'flashcards')),
      );

    const totalItems = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / pageSize);

    if (totalItems === 0) {
      return {
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: page,
        pageSize,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }

    const aiOutput = await this.drizzle
      .select()
      .from(aiOutputs)
      .innerJoin(materials, eq(aiOutputs.materialId, materials.id))
      .where(
        and(eq(materials.userId, userId), eq(aiOutputs.type, 'flashcards')),
      )
      .orderBy(
        sortBy === 'createdAt-desc'
          ? desc(aiOutputs.createdAt)
          : sortBy === 'createdAt-asc'
            ? aiOutputs.createdAt
            : sortBy === 'title-desc'
              ? desc(materials.title)
              : materials.title,
      )
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    if (aiOutput.length === 0) {
      return {
        data: [],
        totalItems: 0,
        totalPages: 1,
        currentPage: page,
        pageSize,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }

    const data = await Promise.all(
      aiOutput.map(async (output) => {
        const flashcardsArr = await this.drizzle
          .select()
          .from(flashcards)
          .innerJoin(
            flashcardProgress,
            eq(flashcards.id, flashcardProgress.flashcardId),
          )
          .where(eq(flashcards.aiOutputId, output.ai_outputs.id));

        const total = flashcardsArr.length;
        const known = flashcardsArr.filter(
          (f) => f.flashcard_progress.status === FlashcardProgressStatus.known,
        ).length;
        const review = flashcardsArr.filter(
          (f) => f.flashcard_progress.status === FlashcardProgressStatus.review,
        ).length;

        const outputData = toAIOutputGraphQL(output.ai_outputs);
        const materialData = toMaterialGraphQL(output.materials);

        return {
          ...outputData,
          material: materialData,
          total,
          known,
          review,
          lastUpdated: new Date(),
        };
      }),
    );

    return {
      data,
      totalItems,
      totalPages,
      currentPage: page,
      pageSize,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
  async getFlashcardProgressByMaterial(materialId: string, userId: string) {
    const materialAccess = await this.drizzle
      .select()
      .from(materials)
      .where(and(eq(materials.id, materialId), eq(materials.userId, userId)));

    if (materialAccess.length === 0) {
      throw new UnauthorizedException('Material not found or access denied');
    }

    const aiOutput = await this.drizzle
      .select()
      .from(aiOutputs)
      .where(
        and(
          eq(aiOutputs.materialId, materialId),
          eq(aiOutputs.type, 'flashcards'),
        ),
      );

    if (aiOutput.length === 0) {
      return [];
    }

    const flashcardsArr = await this.drizzle
      .select()
      .from(flashcards)
      .innerJoin(
        flashcardProgress,
        eq(flashcards.id, flashcardProgress.flashcardId),
      )
      .where(
        and(
          eq(flashcards.aiOutputId, aiOutput[0].id),
          eq(flashcardProgress.userId, userId),
        ),
      );

    return flashcardsArr.map((flashcard) => ({
      ...toFlashcardGraphQL(flashcard.flashcards),
      status: flashcard.flashcard_progress.status,
    }));
  }

  async createFlashcards(materialId: string, userId: string) {
    const materialAccess = await this.drizzle
      .select()
      .from(materials)
      .where(and(eq(materials.id, materialId), eq(materials.userId, userId)));
    if (materialAccess.length === 0) {
      throw new UnauthorizedException('Material not found or access denied');
    }

    const existingAiOutput = await this.drizzle
      .select()
      .from(aiOutputs)
      .where(
        and(
          eq(aiOutputs.materialId, materialId),
          eq(aiOutputs.type, 'flashcards'),
        ),
      );

    if (existingAiOutput.length > 0) {
      throw new NotFoundException(
        'Flashcards already generated for this material',
      );
    }

    const tokensCharged = await this.billingService.useTokens(userId, 2);

    if (!tokensCharged) {
      throw new Error('Insufficient tokens to generate summary');
    }

    const generatedFlashcards =
      this.openAiService.generateFlashcards(materialId);
    if (!generatedFlashcards) {
      throw new NotFoundException('No flashcards generated for this material');
    }

    const aiOutput = await this.drizzle
      .insert(aiOutputs)
      .values({
        materialId: materialId,
        type: 'flashcards',
        content: { flashcards: generatedFlashcards },
        createdAt: new Date(),
      })
      .returning();

    const dbFlashcards = await Promise.all(
      generatedFlashcards.map(async (flashcard) => {
        const inserted = await this.drizzle
          .insert(flashcards)
          .values({
            aiOutputId: aiOutput[0].id,
            question: flashcard.question,
            answer: flashcard.answer,
            createdAt: new Date(),
          })
          .returning();
        return inserted[0];
      }),
    );

    await Promise.all(
      dbFlashcards.map(async (flashcard) => {
        await this.drizzle.insert(flashcardProgress).values({
          flashcardId: flashcard.id,
          userId: userId,
          status: FlashcardProgressStatus.review,
        });
      }),
    );

    return true;
  }

  async regenerateFlashcards(
    materialId: string,
    userId: string,
  ): Promise<boolean> {
    const flashcards = await this.drizzle
      .select()
      .from(aiOutputs)
      .where(
        and(
          eq(aiOutputs.materialId, materialId),
          eq(aiOutputs.type, 'flashcards'),
        ),
      );

    const removalOfFlashcards = await this.deleteFlashcards(
      flashcards[0].id,
      userId,
    );

    if (!removalOfFlashcards) {
      return false;
    }

    return await this.createFlashcards(materialId, userId);
  }

  async deleteFlashcards(id: string, userId: string) {
    const aiOutput = await this.drizzle
      .select()
      .from(aiOutputs)
      .innerJoin(materials, eq(aiOutputs.materialId, materials.id))
      .where(
        and(
          eq(aiOutputs.id, id),
          eq(aiOutputs.type, 'flashcards'),
          eq(materials.userId, userId),
        ),
      );

    if (aiOutput.length === 0) {
      const materialAccess = await this.drizzle
        .select()
        .from(materials)
        .where(and(eq(materials.id, id), eq(materials.userId, userId)));

      if (materialAccess.length === 0) {
        throw new UnauthorizedException('Material not found or access denied');
      }

      const aiOutputByMaterial = await this.drizzle
        .select()
        .from(aiOutputs)
        .where(
          and(eq(aiOutputs.materialId, id), eq(aiOutputs.type, 'flashcards')),
        );

      if (aiOutputByMaterial.length === 0) {
        throw new NotFoundException('No flashcards found for this material');
      }

      const targetAiOutputId = aiOutputByMaterial[0].id;
      await this.deleteFlashcardsByAiOutputId(targetAiOutputId);
    } else {
      const targetAiOutputId = aiOutput[0].ai_outputs.id;
      await this.deleteFlashcardsByAiOutputId(targetAiOutputId);
    }

    return true;
  }

  private async deleteFlashcardsByAiOutputId(aiOutputId: string) {
    const flashcardsToDelete = await this.drizzle
      .select()
      .from(flashcards)
      .where(eq(flashcards.aiOutputId, aiOutputId));

    if (flashcardsToDelete.length === 0) {
      throw new NotFoundException('No flashcards found for this AI output');
    }

    const flashcardIds = flashcardsToDelete.map((f) => f.id);

    if (flashcardIds.length > 0) {
      await this.drizzle
        .delete(flashcardProgress)
        .where(inArray(flashcardProgress.flashcardId, flashcardIds));
    }

    await this.drizzle
      .delete(flashcards)
      .where(eq(flashcards.aiOutputId, aiOutputId));

    await this.drizzle.delete(aiOutputs).where(eq(aiOutputs.id, aiOutputId));
  }

  async updateFlashcardStatus(
    id: string,
    userId: string,
    status: FlashcardProgressStatus,
  ) {
    const flashcardProgressEntry = await this.drizzle
      .select()
      .from(flashcardProgress)
      .where(
        and(
          eq(flashcardProgress.flashcardId, id),
          eq(flashcardProgress.userId, userId),
        ),
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
          eq(flashcardProgress.userId, userId),
        ),
      );

    return true;
  }

  async resetFlashcardProgress(id: string, userId: string) {
    const aiOutput = await this.drizzle
      .select()
      .from(aiOutputs)
      .innerJoin(materials, eq(aiOutputs.materialId, materials.id))
      .where(
        and(
          eq(aiOutputs.id, id),
          eq(aiOutputs.type, 'flashcards'),
          eq(materials.userId, userId),
        ),
      );

    if (aiOutput.length === 0) {
      throw new NotFoundException('Flashcard set not found or access denied');
    }

    await this.drizzle
      .update(flashcardProgress)
      .set({ status: FlashcardProgressStatus.review })
      .where(
        and(
          eq(flashcardProgress.userId, userId),
          sql`${flashcardProgress.flashcardId} IN (
          SELECT ${flashcards.id} FROM ${flashcards} 
          WHERE ${flashcards.aiOutputId} = ${id}
        )`,
        ),
      );

    return true;
  }
  async getFlashcardsById(id: string, userId: string, status?: string) {
    const aiOutput = await this.drizzle
      .select()
      .from(aiOutputs)
      .innerJoin(materials, eq(aiOutputs.materialId, materials.id))
      .where(
        and(
          eq(aiOutputs.id, id),
          eq(aiOutputs.type, 'flashcards'),
          eq(materials.userId, userId),
        ),
      );

    if (aiOutput.length === 0) {
      return {
        data: [],
        total: 0,
        known: 0,
        review: 0,
        lastUpdated: new Date(),
      };
    }

    const flashcardsWithProgress = await this.drizzle
      .select()
      .from(flashcards)
      .innerJoin(
        flashcardProgress,
        eq(flashcards.id, flashcardProgress.flashcardId),
      )
      .where(
        status
          ? and(
              eq(flashcards.aiOutputId, aiOutput[0].ai_outputs.id),
              eq(flashcardProgress.status, status as FlashcardProgressStatus),
            )
          : eq(flashcards.aiOutputId, aiOutput[0].ai_outputs.id),
      );

    const data = flashcardsWithProgress.map((flashcard) => ({
      flashcardId: flashcard.flashcards.id,
      statusId: flashcard.flashcard_progress.id,
      question: flashcard.flashcards.question,
      answer: flashcard.flashcards.answer,
      status: flashcard.flashcard_progress.status,
      statusUpdatedAt: flashcard.flashcard_progress.updatedAt,
    }));

    const flashcardsArr = await this.drizzle
      .select()
      .from(flashcards)
      .innerJoin(
        flashcardProgress,
        eq(flashcards.id, flashcardProgress.flashcardId),
      )
      .where(eq(flashcards.aiOutputId, aiOutput[0].ai_outputs.id));

    const total = flashcardsArr.length;
    const known = flashcardsArr.filter(
      (f) => f.flashcard_progress.status === FlashcardProgressStatus.known,
    ).length;
    const review = flashcardsArr.filter(
      (f) => f.flashcard_progress.status === FlashcardProgressStatus.review,
    ).length;

    return {
      data,
      material: toMaterialGraphQL(aiOutput[0].materials),
      total,
      known,
      review,
      lastUpdated: new Date(),
    };
  }
}
