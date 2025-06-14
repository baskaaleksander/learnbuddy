import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from 'src/database/drizzle.module';
import { aiOutputs, materials, quizResults } from 'src/database/schema';
// import { parsePublicPdfFromS3 } from 'src/helpers/parse-pdf';
import { toAIOutputGraphQL } from 'src/mappers/ai-output.mapper';
import { toMaterialGraphQL } from 'src/materials/materials.mapper';
import { OpenAiService } from 'src/open-ai/open-ai.service';
import { toQuizResultGraphQl } from './quiz-result.mapper';
import { QuizResponse } from 'src/utils/types';

@Injectable()
export class QuizService {
  constructor(
    @Inject('DRIZZLE') private drizzle: typeof db,
    private readonly openAiService: OpenAiService,
  ) {}

  async getQuizesByMaterial(materialId: string, userId: string) {
    const materialAccess = await this.drizzle
      .select()
      .from(materials)
      .where(and(eq(materials.id, materialId), eq(materials.userId, userId)));

    if (materialAccess.length === 0) {
      throw new Error('Material not found or access denied');
    }

    const quiz = await this.drizzle
      .select()
      .from(aiOutputs)
      .where(
        and(eq(aiOutputs.materialId, materialId), eq(aiOutputs.type, 'quiz')),
      )
      .limit(1);

    if (quiz.length === 0) {
      return null;
    }

    const averageScore = await this.drizzle
      .select({
        averageScore: sql<number>`AVG(${quizResults.score})::numeric`,
        totalAttempts: sql<number>`COUNT(*)::integer`,
        bestScore: sql<number>`MAX(${quizResults.score})::integer`,
        totalQuestions: quizResults.totalQuestions,
      })
      .from(quizResults)
      .where(
        and(
          eq(quizResults.aiOutputId, quiz[0].id),
          eq(quizResults.userId, userId),
        ),
      )
      .groupBy(quizResults.totalQuestions);

    const latestQuizResult = await this.drizzle
      .select()
      .from(quizResults)
      .where(
        and(
          eq(quizResults.aiOutputId, quiz[0].id),
          eq(quizResults.userId, userId),
        ),
      )
      .orderBy(desc(quizResults.completedAt))
      .limit(1);

    const quizGraphQL = toAIOutputGraphQL(quiz[0]);
    const avgData = averageScore.length > 0 ? averageScore[0] : null;

    return {
      ...quizGraphQL,
      averageScore: avgData ? parseFloat(avgData.averageScore.toString()) : 0,
      totalAttempts: avgData ? avgData.totalAttempts : 0,
      averagePercentage: avgData
        ? (parseFloat(avgData.averageScore.toString()) /
            avgData.totalQuestions) *
          100
        : 0,
      bestScore: avgData ? avgData.bestScore : 0,
      latestResult:
        latestQuizResult.length > 0
          ? {
              score: latestQuizResult[0].score,
              completedAt: latestQuizResult[0].completedAt,
            }
          : null,
      material: toMaterialGraphQL(materialAccess[0]),
    };
  }

  async getQuizesByUser(
    userId: string,
    page: number = 1,
    pageSize: number = 10,
    sortBy: string = 'createdAt-desc',
  ) {
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(aiOutputs)
      .innerJoin(materials, eq(aiOutputs.materialId, materials.id))
      .where(and(eq(aiOutputs.type, 'quiz'), eq(materials.userId, userId)));

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

    const quizzes = await this.drizzle
      .select()
      .from(aiOutputs)
      .innerJoin(materials, eq(aiOutputs.materialId, materials.id))
      .where(and(eq(aiOutputs.type, 'quiz'), eq(materials.userId, userId)))
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

    const quizzesWithStats = quizzes.map(async (quiz) => {
      const averageScore = await this.drizzle
        .select({
          averageScore: sql<number>`AVG(${quizResults.score})::numeric`,
          totalAttempts: sql<number>`COUNT(*)::integer`,
          bestScore: sql<number>`MAX(${quizResults.score})::integer`,
          totalQuestions: quizResults.totalQuestions,
        })
        .from(quizResults)
        .where(
          and(
            eq(quizResults.aiOutputId, quiz.ai_outputs.id),
            eq(quizResults.userId, userId),
          ),
        )
        .groupBy(quizResults.totalQuestions);

      const latestQuizResult = await this.drizzle
        .select()
        .from(quizResults)
        .where(
          and(
            eq(quizResults.aiOutputId, quiz.ai_outputs.id),
            eq(quizResults.userId, userId),
          ),
        )
        .orderBy(desc(quizResults.completedAt))
        .limit(1);

      return {
        ...toAIOutputGraphQL(quiz.ai_outputs),
        averageScore:
          averageScore.length > 0
            ? parseFloat(averageScore[0].averageScore.toString())
            : 0,
        totalAttempts:
          averageScore.length > 0 ? averageScore[0].totalAttempts : 0,
        averagePercentage:
          averageScore.length > 0
            ? (parseFloat(averageScore[0].averageScore.toString()) /
                averageScore[0].totalQuestions) *
              100
            : 0,
        bestScore: averageScore.length > 0 ? averageScore[0].bestScore : 0,
        latestResult:
          latestQuizResult.length > 0
            ? {
                score: latestQuizResult[0].score,
                completedAt: latestQuizResult[0].completedAt,
              }
            : null,
        material: toMaterialGraphQL(quiz.materials),
      };
    });

    const data = await Promise.all(quizzesWithStats);

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

  //add stats
  async getQuizById(id: string, userId: string) {
    const quiz = await this.drizzle
      .select()
      .from(aiOutputs)
      .where(and(eq(aiOutputs.id, id)));

    if (quiz.length === 0) {
      throw new NotFoundException('Quiz not found');
    }

    const materialAccess = await this.drizzle
      .select()
      .from(materials)
      .where(
        and(eq(materials.id, quiz[0].materialId), eq(materials.userId, userId)),
      );

    if (materialAccess.length === 0) {
      throw new UnauthorizedException('Material not found or access denied');
    }

    return toAIOutputGraphQL(quiz[0]);
  }

  async createQuiz(materialId: string, userId: string) {
    const material = await this.drizzle
      .select()
      .from(materials)
      .where(and(eq(materials.id, materialId), eq(materials.userId, userId)));

    if (material.length === 0) {
      throw new UnauthorizedException('Material not found or access denied');
    }

    // const pdfContent = await parsePublicPdfFromS3(material[0].content);

    // if (!pdfContent) {
    //     throw new NotFoundException('PDF content not found');
    // }

    const pdfContent = 'test';
    const quiz = this.openAiService.generateQuiz(pdfContent);

    if (!quiz) {
      throw new Error('Failed to generate quiz');
    }

    await this.drizzle.insert(aiOutputs).values({
      materialId: materialId,
      type: 'quiz',
      content: quiz,
      createdAt: new Date(),
    });

    return true;
  }

  async deleteQuiz(id: string, userId: string) {
    const quiz = await this.drizzle
      .select()
      .from(aiOutputs)
      .where(eq(aiOutputs.id, id));

    if (quiz.length === 0) {
      throw new NotFoundException('Quiz not found');
    }

    const materialAccess = await this.drizzle
      .select()
      .from(materials)
      .where(
        and(eq(materials.id, quiz[0].materialId), eq(materials.userId, userId)),
      );

    if (materialAccess.length === 0) {
      throw new UnauthorizedException('Material not found or access denied');
    }

    await this.drizzle.delete(aiOutputs).where(eq(aiOutputs.id, id));

    return true;
  }

  async submitQuiz(
    materialId: string,
    aiOutputId: string,
    userId: string,
    score: number,
  ) {
    const materialAccess = await this.drizzle
      .select()
      .from(materials)
      .where(and(eq(materials.id, materialId), eq(materials.userId, userId)));
    if (materialAccess.length === 0) {
      throw new UnauthorizedException('Material not found or access denied');
    }

    const quiz = (await this.drizzle
      .select()
      .from(aiOutputs)
      .where(
        and(
          eq(aiOutputs.id, aiOutputId),
          eq(aiOutputs.materialId, materialId),
          eq(aiOutputs.type, 'quiz'),
        ),
      )) as QuizResponse[];

    if (quiz.length === 0) {
      throw new NotFoundException('Quiz not found');
    }

    await this.drizzle.insert(quizResults).values({
      userId: userId,
      materialId: materialId,
      aiOutputId: aiOutputId,
      score: score,
      totalQuestions: quiz[0].content.length,
    });

    return true;
  }

  async getQuizResults(quizId: string, userId: string) {
    const results = await this.drizzle
      .select()
      .from(quizResults)
      .where(
        and(eq(quizResults.aiOutputId, quizId), eq(quizResults.userId, userId)),
      );

    if (results.length === 0) {
      throw new NotFoundException('Quiz results not found');
    }

    return results.map((result) => toQuizResultGraphQl(result));
  }
}
