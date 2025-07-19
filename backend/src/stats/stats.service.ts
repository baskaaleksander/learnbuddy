import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { db } from 'src/database/drizzle.module';
import {
  aiOutputs,
  flashcardProgress,
  flashcards,
  materials,
  quizPartials,
  quizResults,
} from 'src/database/schema';
import { FlashcardProgressStatus } from 'src/flashcards/graphql/flashcard-progress.graphql';
import { toAIOutputGraphQL } from 'src/mappers/ai-output.mapper';
import { toMaterialGraphQL } from 'src/materials/graphql/materials.mapper';
import { toQuizPartialGraphQL } from 'src/quiz/graphql/quiz-partial.mapper';

@Injectable()
export class StatsService {
  constructor(@Inject('DRIZZLE') private drizzle: typeof db) {}

  async getFlashcardStats(materialId: string, userId: string) {
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
      return {
        total: 0,
        known: 0,
        review: 0,
        lastUpdated: new Date(),
      };
    }

    const flashcardsArr = await this.drizzle
      .select()
      .from(flashcards)
      .innerJoin(
        flashcardProgress,
        eq(flashcards.id, flashcardProgress.flashcardId),
      )
      .where(eq(flashcards.aiOutputId, aiOutput[0].id));

    const total = flashcardsArr.length;
    const known = flashcardsArr.filter(
      (f) => f.flashcard_progress.status === FlashcardProgressStatus.known,
    ).length;
    const review = flashcardsArr.filter(
      (f) => f.flashcard_progress.status === FlashcardProgressStatus.review,
    ).length;

    return {
      aiOutputId: aiOutput[0].id,
      total,
      known,
      review,
      lastUpdated: new Date(),
    };
  }

  async getUserStats(userId: string) {
    const materialsData = await this.getMaterialsWithAiOutputs(userId);

    if (materialsData.length === 0) {
      return {
        materialsCount: 0,
        quizzesCount: 0,
        flashcardsCount: 0,
        summariesCount: 0,
        totalQuizResults: 0,
        totalFlashcardsKnown: 0,
        totalFlashcardsToReview: 0,
        recentlyCreatedAiOutputs: [],
        recentlyCreatedMaterials: [],
      };
    }

    const [
      materialsCounts,
      quizStats,
      flashcardStats,
      recentActivity,
      quizPartials,
    ] = await Promise.all([
      this.getMaterialsCounts(materialsData),
      this.getQuizStats(userId),
      this.getFlashcardUserStats(userId),
      this.getRecentActivity(userId),
      this.getQuizPartials(userId),
    ]);

    return {
      ...materialsCounts,
      ...quizStats,
      ...flashcardStats,
      ...recentActivity,
      ...quizPartials,
    };
  }

  private async getMaterialsWithAiOutputs(userId: string) {
    return this.drizzle
      .select()
      .from(materials)
      .innerJoin(aiOutputs, eq(materials.id, aiOutputs.materialId))
      .where(eq(materials.userId, userId));
  }

  private getMaterialsCounts(materialsData: any[]) {
    return {
      materialsCount: materialsData.length,
      quizzesCount: materialsData.filter((m) => m.ai_outputs.type === 'quiz')
        .length,
      flashcardsCount: materialsData.filter(
        (m) => m.ai_outputs.type === 'flashcards',
      ).length,
      summariesCount: materialsData.filter(
        (m) => m.ai_outputs.type === 'summary',
      ).length,
    };
  }

  private async getQuizStats(userId: string) {
    const quizResultsData = await this.drizzle
      .select()
      .from(quizResults)
      .where(eq(quizResults.userId, userId));

    return {
      totalQuizResults: quizResultsData.length,
    };
  }

  private async getFlashcardUserStats(userId: string) {
    const [flashcardsKnown, flashcardsToReview] = await Promise.all([
      this.drizzle
        .select()
        .from(flashcardProgress)
        .where(
          and(
            eq(flashcardProgress.userId, userId),
            eq(flashcardProgress.status, FlashcardProgressStatus.known),
          ),
        ),
      this.drizzle
        .select()
        .from(flashcardProgress)
        .where(
          and(
            eq(flashcardProgress.userId, userId),
            eq(flashcardProgress.status, FlashcardProgressStatus.review),
          ),
        ),
    ]);

    return {
      totalFlashcardsKnown: flashcardsKnown.length,
      totalFlashcardsToReview: flashcardsToReview.length,
    };
  }

  private async getRecentActivity(userId: string) {
    const recentAiOutputs = await this.drizzle
      .select()
      .from(aiOutputs)
      .innerJoin(materials, eq(materials.id, aiOutputs.materialId))
      .where(eq(materials.userId, userId))
      .orderBy(desc(aiOutputs.createdAt))
      .limit(5);

    const recentMaterials = await this.drizzle
      .select()
      .from(materials)
      .where(eq(materials.userId, userId))
      .orderBy(desc(materials.createdAt))
      .limit(5);

    const recentAiOutputsGraphQL = recentAiOutputs.map((output) => {
      return {
        ...toAIOutputGraphQL(output.ai_outputs),
        material: toMaterialGraphQL(output.materials),
      };
    });
    const recentMaterialsGraphQL = recentMaterials.map((material) =>
      toMaterialGraphQL(material),
    );

    return {
      recentlyCreatedAiOutputs: recentAiOutputsGraphQL,
      recentlyCreatedMaterials: recentMaterialsGraphQL,
    };
  }

  private async getQuizPartials(userId: string) {
    const quizPartialsData = await this.drizzle
      .select()
      .from(quizPartials)
      .where(eq(quizPartials.userId, userId));

    const partials = quizPartialsData.map((partial) =>
      toQuizPartialGraphQL(partial),
    );

    return {
      quizPartials: partials,
    };
  }
}
