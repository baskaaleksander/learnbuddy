import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../database/drizzle.module';
import {
  aiOutputs,
  flashcardProgress,
  flashcards,
  materials,
  quizPartials,
  quizResults,
  users,
} from '../database/schema';
import { FlashcardProgressStatus } from '../flashcards/graphql/flashcard-progress.graphql';
import { toAIOutputGraphQL } from '../mappers/ai-output.mapper';
import { toMaterialGraphQL } from '../materials/graphql/materials.mapper';
import { toQuizPartialGraphQL } from '../quiz/graphql/quiz-partial.mapper';

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
    const isUserExists = await this.drizzle
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (isUserExists.length === 0) {
      throw new UnauthorizedException('User does not exist');
    }

    const materialsWithAiOutputsData =
      await this.getMaterialsWithAiOutputs(userId);

    const materialsData = await this.getMaterialsData(userId);

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
      this.getMaterialsCounts(materialsWithAiOutputsData, materialsData),
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

  private async getMaterialsData(userId: string) {
    return this.drizzle
      .select()
      .from(materials)
      .where(eq(materials.userId, userId));
  }

  private getMaterialsCounts(
    materialsWithAiOutputsData: any[],
    materialsData: any[],
  ) {
    return {
      materialsCount: materialsData.length,
      quizzesCount: materialsWithAiOutputsData.filter(
        (m) => m.ai_outputs.type === 'quiz',
      ).length,
      flashcardsCount: materialsWithAiOutputsData.filter(
        (m) => m.ai_outputs.type === 'flashcards',
      ).length,
      summariesCount: materialsWithAiOutputsData.filter(
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
