import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from 'src/database/drizzle.module';
import {
  aiOutputs,
  materials,
  quizPartials,
  quizResults,
} from 'src/database/schema';
// import { parsePublicPdfFromS3 } from 'src/helpers/parse-pdf';
import { toAIOutputGraphQL } from 'src/mappers/ai-output.mapper';
import { toMaterialGraphQL } from 'src/materials/materials.mapper';
import { OpenAiService } from 'src/open-ai/open-ai.service';
import { toQuizResultGraphQl } from './quiz-result.mapper';
import { QuizResponse } from 'src/utils/types';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RedisService } from '../redis/redis.service';
import { QuizPartialInput } from './dtos/quiz-partial.input';
import { Logger } from 'nestjs-pino';
import { toQuizResponseGraphQl } from './quiz-response.mapper';
import { Quiz } from 'src/utils/types';

@Injectable()
export class QuizService {
  constructor(
    @Inject('DRIZZLE') private drizzle: typeof db,
    private readonly openAiService: OpenAiService,
    @InjectQueue('quizProgress') private quizProgressQueue: Queue,
    private redis: RedisService,
    private readonly logger: Logger,
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
        totalPages: 1,
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

  async getQuizById(id: string, userId: string) {
    const quizJoined = await this.drizzle
      .select()
      .from(aiOutputs)
      .innerJoin(materials, eq(aiOutputs.materialId, materials.id))
      .where(and(eq(aiOutputs.id, id), eq(materials.userId, userId)));

    if (quizJoined.length === 0) {
      throw new NotFoundException('Quiz not found');
    }

    const quiz = quizJoined[0].ai_outputs;
    const material = quizJoined[0].materials;

    const quizContent = quiz.content as Quiz[];
    const content = quizContent.map((item) => ({
      question: item.question,
      answers: item.answers,
    }));

    const existingSession = await this.redis.get(`quizSession:${userId}:${id}`);

    if (existingSession) {
      const quizPartialData = JSON.parse(
        existingSession as string,
      ) as QuizPartialInput;
      this.logger.log(
        `[QuizPartial] Found existing session for user ${userId} for quiz ${id}`,
      );
      return {
        ...toQuizResponseGraphQl({
          ...quiz,
          content,
        }),
        partialData: quizPartialData,
        material: toMaterialGraphQL(material),
      };
    }

    const quizPartial = await this.drizzle
      .select()
      .from(quizPartials)
      .where(and(eq(quizPartials.userId, userId), eq(quizPartials.quizId, id)));

    if (quizPartial.length > 0) {
      this.logger.log(
        `[QuizPartial] Found partial data for user ${userId} for quiz ${id}`,
      );
      return {
        ...toQuizResponseGraphQl({
          ...quiz,
          content,
        }),
        partialData: {
          currentQuestionIndex: quizPartial[0].currentQuestionIndex,
          questionsAndAnswers: quizPartial[0].answers,
        },
        material: toMaterialGraphQL(material),
      };
    }

    return {
      ...toQuizResponseGraphQl({
        ...quiz,
        content,
      }),
      material: toMaterialGraphQL(material),
    };
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

  async resetQuizProgress(userId: string, quizId: string) {
    const existingSession = await this.redis.get(
      `quizSession:${userId}:${quizId}`,
    );
    if (existingSession) {
      this.logger.log(
        `[QuizPartial] Found existing session for user ${userId} for quiz ${quizId}, deleting it`,
      );
      await this.redis.delete(`quizSession:${userId}:${quizId}`);
    } else {
      this.logger.log(
        `[QuizPartial] No existing session found for user ${userId} for quiz ${quizId}`,
      );
    }

    const quizPartial = await this.drizzle
      .select()
      .from(quizPartials)
      .where(
        and(eq(quizPartials.userId, userId), eq(quizPartials.quizId, quizId)),
      );

    this.logger.log(
      `[QuizPartial] Attempting to reset progress for user ${userId} for quiz ${quizId}, existingPartial: ${quizPartial.length > 0}`,
    );

    if (quizPartial.length > 0) {
      await this.drizzle
        .delete(quizPartials)
        .where(
          and(eq(quizPartials.userId, userId), eq(quizPartials.quizId, quizId)),
        );
      this.logger.log(
        `[QuizPartial] Reset progress for user ${userId} for quiz ${quizId}`,
      );
      return true;
    }
    this.logger.warn(
      `[QuizPartial] No progress found to reset for user ${userId} for quiz ${quizId}`,
    );
    return false;
  }

  async getQuizResultByQuizId(quizId: string, userId: string) {
    const results = await this.drizzle
      .select()
      .from(quizResults)
      .where(
        and(eq(quizResults.aiOutputId, quizId), eq(quizResults.userId, userId)),
      )
      .orderBy(desc(quizResults.completedAt));

    if (results.length === 0) {
      return null;
    }

    const result = results[0];

    if (
      !result.id ||
      !result.userId ||
      !result.materialId ||
      !result.aiOutputId
    ) {
      this.logger.error(
        `Invalid quiz result data for quiz ${quizId} and user ${userId}`,
      );
      return null;
    }

    return toQuizResultGraphQl(result);
  }

  async getQuizResultsByQuizId(
    quizId: string,
    userId: string,
    page: number = 1,
    pageSize: number = 10,
    sortBy: string = 'completedAt-desc',
  ) {
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(quizResults)
      .where(
        and(eq(quizResults.aiOutputId, quizId), eq(quizResults.userId, userId)),
      );

    const totalItems = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / pageSize);

    if (totalItems === 0) {
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

    const results = await this.drizzle
      .select()
      .from(quizResults)
      .where(
        and(eq(quizResults.aiOutputId, quizId), eq(quizResults.userId, userId)),
      )
      .orderBy(
        sortBy === 'completedAt-desc'
          ? desc(quizResults.completedAt)
          : sortBy === 'completedAt-asc'
            ? quizResults.completedAt
            : sortBy === 'score-desc'
              ? desc(quizResults.score)
              : quizResults.score,
      )
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const data = results.map((result) => toQuizResultGraphQl(result));

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

  async saveQuizProgressAsync(
    userId: string,
    quizId: string,
    quizPartialData: QuizPartialInput,
  ) {
    await this.redis.set(
      `quizSession:${userId}:${quizId}`,
      JSON.stringify(quizPartialData),
      1800,
    );

    try {
      const job = await this.quizProgressQueue.add(
        'savePartial',
        { userId, quizId, quizPartialData },
        {
          attempts: 3,
        },
      );
      console.log('Job added:', job.id);
    } catch (err) {
      console.error('Error adding job:', err);
    }

    return true;
  }

  async savePartialToDB(
    userId: string,
    quizId: string,
    quizPartialData: QuizPartialInput,
  ) {
    const quiz = (await this.drizzle
      .select()
      .from(aiOutputs)
      .where(
        and(eq(aiOutputs.id, quizId), eq(aiOutputs.type, 'quiz')),
      )) as QuizResponse[];

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

    const checkedAnswers = quizPartialData.questionsAndAnswers.map((qa) => ({
      question: qa.question,
      answer: qa.answer,
      isCorrect: quiz[0].content[qa.question - 1].correct_answer === qa.answer,
    }));

    const quizLength = quiz[0].content.length;
    const isQuizComplete =
      quizPartialData.questionsAndAnswers.length === quizLength;

    const existingPartial = await this.drizzle
      .select()
      .from(quizPartials)
      .where(
        and(eq(quizPartials.userId, userId), eq(quizPartials.quizId, quizId)),
      );

    this.logger.log(
      `[QuizPartial] Saving partial for user ${userId} for quiz ${quizId}`,
    );

    if (existingPartial.length > 0) {
      await this.drizzle
        .update(quizPartials)
        .set({
          currentQuestionIndex: quizPartialData.currentQuestionIndex,
          answers: checkedAnswers,
          lastUpdated: new Date(),
        })
        .where(
          and(eq(quizPartials.userId, userId), eq(quizPartials.quizId, quizId)),
        );
    } else {
      await this.drizzle.insert(quizPartials).values({
        userId,
        quizId,
        currentQuestionIndex: quizPartialData.currentQuestionIndex,
        answers: checkedAnswers,
        lastUpdated: new Date(),
      });
    }

    if (isQuizComplete) {
      this.logger.log(
        `[QuizSubmission] User ${userId} completed quiz ${quizId}`,
      );
      await this.drizzle
        .delete(quizPartials)
        .where(
          and(eq(quizPartials.userId, userId), eq(quizPartials.quizId, quizId)),
        );
      const quizResult = await this.drizzle
        .insert(quizResults)
        .values({
          userId,
          materialId: quiz[0].materialId,
          aiOutputId: quizId,
          score: checkedAnswers.reduce(
            (acc, qa) => acc + (qa.isCorrect ? 1 : 0),
            0,
          ),
          totalQuestions: quizLength,
          answers: checkedAnswers,
          completedAt: new Date(),
        })
        .returning();
      await this.redis.delete(`quizSession:${userId}:${quizId}`);
      return quizResult[0].id;
    }

    this.logger.log(
      `[QuizPartial] User ${userId} reached question ${quizPartialData.currentQuestionIndex}`,
    );
    return null;
  }
}
