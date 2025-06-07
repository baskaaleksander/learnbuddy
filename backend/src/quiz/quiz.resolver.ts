import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PayloadDto } from 'src/auth/dtos/payload.dto';
import { CurrentUser } from 'src/decorators/gql-current-user.decorator';
import { GqlAuthGuard } from 'src/guards/gql-auth.guard';
import { AIOutputType } from 'src/graphql/ai-output.graphql';
import { QuizService } from './quiz.service';
import { SubmitQuizInput } from './dtos/submit-quiz.input';
import { QuizResultType } from './quiz-result.graphql';
import { QuizOutputType } from './quiz.graphql';

@Resolver(() => AIOutputType)
export class QuizResolver {
    constructor(
        private readonly quizService: QuizService,
    ) {}

    @UseGuards(GqlAuthGuard)
    @Query(() => AIOutputType, { nullable: true })
    async getQuizById(
        @CurrentUser() user: PayloadDto, 
        @Args('id') id: string
    ) {
        return this.quizService.getQuizById(id, user.id);
    }

    @UseGuards(GqlAuthGuard)
    @Query(() => QuizOutputType)
    async getQuizzesByMaterial(
        @CurrentUser() user: PayloadDto,
        @Args('materialId') materialId: string
    ) {
        return this.quizService.getQuizesByMaterial(materialId, user.id);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Boolean)
    async createQuiz(
        @CurrentUser() user: PayloadDto, 
        @Args('materialId') materialId: string, 
    ) {
        return this.quizService.createQuiz(materialId, user.id);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Boolean)
    async deleteQuiz(
        @CurrentUser() user: PayloadDto, 
        @Args('id') id: string
    ) {
        return this.quizService.deleteQuiz(id, user.id);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Boolean)
    async submitQuiz(
        @CurrentUser() user: PayloadDto, 
        @Args('input') input: SubmitQuizInput
    ) {
        return this.quizService.submitQuiz(input.materialId, input.aiOutputId, user.id, input.score);
    }

    @UseGuards(GqlAuthGuard)
    @Query(() => [QuizResultType])
    async getQuizResults(
        @CurrentUser() user: PayloadDto, 
        @Args('quizId') quizId: string
    ) {
        return this.quizService.getQuizResults(quizId, user.id);
    }
}
