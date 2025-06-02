import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { db } from 'src/database/drizzle.module';
import { aiOutputs, materials, quizResults } from 'src/database/schema';
import { parsePublicPdfFromS3 } from 'src/helpers/parse-pdf';
import { toAIOutputGraphQL } from 'src/mappers/ai-output.mapper';
import { OpenAiService } from 'src/open-ai/open-ai.service';
import { toQuizResultGraphQl } from './quiz-result.mapper';
import { QuizResponse } from 'src/utils/types';

@Injectable()
export class QuizService {
    constructor(
        @Inject('DRIZZLE') private drizzle: typeof db,
        private readonly openAiService: OpenAiService
) {}

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
            
        return quizes.map(quiz => toAIOutputGraphQL(quiz));

    }

    async getQuizById(id: string, userId: string) {
        const quiz = await this.drizzle
            .select()
            .from(aiOutputs)
            .where(
                and(
                    eq(aiOutputs.id, id),
                )
            );
        

        if (quiz.length === 0) {
            throw new NotFoundException('Quiz not found');
        }

        const materialAccess = await this.drizzle
            .select()
            .from(materials)
            .where(
                and(
                    eq(materials.id, quiz[0].materialId),
                    eq(materials.userId, userId)
                )
            );

        if (materialAccess.length === 0) {
            throw new UnauthorizedException('Material not found or access denied');
        }

        return toAIOutputGraphQL(quiz[0]);
    }

    async createQuiz(materialId: string, userId: string){
        const material = await this.drizzle
            .select()
            .from(materials)
            .where(
                and(
                    eq(materials.id, materialId),
                    eq(materials.userId, userId)
                )
            );

        if (material.length === 0) {
            throw new UnauthorizedException('Material not found or access denied');
        }

        // const pdfContent = await parsePublicPdfFromS3(material[0].content);

        // if (!pdfContent) {
        //     throw new NotFoundException('PDF content not found');
        // }

        const pdfContent = "test";
        const quiz = await this.openAiService.generateQuiz(pdfContent);

        if (!quiz) {
            throw new Error('Failed to generate quiz');
        }

        await this.drizzle
            .insert(aiOutputs)
            .values({
                materialId: materialId,
                type: 'quiz',
                content: quiz,
                createdAt: new Date(),
            })

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
                and(
                    eq(materials.id, quiz[0].materialId),
                    eq(materials.userId, userId)
                )
            );

        if (materialAccess.length === 0) {
            throw new UnauthorizedException('Material not found or access denied');
        }

        await this.drizzle
            .delete(aiOutputs)
            .where(eq(aiOutputs.id, id));

        return true;
    }

    async submitQuiz(materialId: string, aiOutputId: string, userId: string, score: number){
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

        const quiz = await this.drizzle
            .select()
            .from(aiOutputs)
            .where(
                and(
                    eq(aiOutputs.id, aiOutputId),
                    eq(aiOutputs.materialId, materialId),
                    eq(aiOutputs.type, 'quiz')
                )
            ) as QuizResponse[];

        if (quiz.length === 0) {
            throw new NotFoundException('Quiz not found');
        }

        await this.drizzle
            .insert(quizResults)
            .values({
                userId: userId,
                materialId: materialId,
                aiOutputId: aiOutputId,
                score: score,
                totalQuestions: quiz[0].content.flashcards.length,
            })

            return true;
    }

    async getQuizResults(quizId: string, userId: string) {

        const results = await this.drizzle
            .select()
            .from(quizResults)
            .where(
                and(
                    eq(quizResults.aiOutputId, quizId),
                    eq(quizResults.userId, userId)
                )
            );

        if (results.length === 0) {
            throw new NotFoundException('Quiz results not found');
        }

        return results.map(result => toQuizResultGraphQl(result))
    }

}
