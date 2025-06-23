import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PayloadDto } from 'src/auth/dtos/payload.dto';
import { CurrentUser } from 'src/decorators/gql-current-user.decorator';
import { GqlAuthGuard } from 'src/guards/gql-auth.guard';
import { QuizService } from './quiz.service';
import { PaginatedQuizResultType, QuizResultType } from './quiz-result.graphql';
import {
  QuizOutputType,
  PaginatedQuizResponse,
  QuizWithPartialOutputType,
} from './quiz.graphql';
import { QuestionAndAnswer, QuizPartialInput } from './dtos/quiz-partial.input';

@Resolver(() => QuizOutputType)
export class QuizResolver {
  constructor(private readonly quizService: QuizService) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => QuizWithPartialOutputType, { nullable: true })
  async getQuizById(@CurrentUser() user: PayloadDto, @Args('id') id: string) {
    return this.quizService.getQuizById(id, user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => QuizResultType, { nullable: true })
  async getQuizResultById(
    @CurrentUser() user: PayloadDto,
    @Args('id') id: string,
  ) {
    return this.quizService.getQuizResultById(id, user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => QuizResultType, { nullable: true })
  async getQuizResultByQuizId(
    @CurrentUser() user: PayloadDto,
    @Args('id') id: string,
  ) {
    return await this.quizService.getQuizResultByQuizId(id, user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => QuizOutputType, { nullable: true })
  async getQuizzesByMaterial(
    @CurrentUser() user: PayloadDto,
    @Args('materialId') materialId: string,
  ) {
    return this.quizService.getQuizesByMaterial(materialId, user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => PaginatedQuizResultType, { nullable: true })
  async getQuizResultsByQuizId(
    @CurrentUser() user: PayloadDto,
    @Args('quizId') quizId: string,
    @Args('page', { type: () => Int, nullable: true }) offset?: number,
    @Args('pageSize', { type: () => Int, nullable: true }) limit?: number,
    @Args('sortBy', { type: () => String, nullable: true }) sortBy?: string,
  ) {
    return this.quizService.getQuizResultsByQuizId(
      quizId,
      user.id,
      offset,
      limit,
      sortBy,
    );
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
  async regenerateQuiz(
    @Args('id') id: string,
    @Args('materialId') materialId: string,
    @CurrentUser() user: PayloadDto,
  ) {
    return this.quizService.regenerateQuiz(id, materialId, user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async deleteQuiz(@CurrentUser() user: PayloadDto, @Args('id') id: string) {
    return this.quizService.deleteQuiz(id, user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async resetQuizProgress(
    @CurrentUser() user: PayloadDto,
    @Args('quizId') quizId: string,
  ) {
    return this.quizService.resetQuizProgress(user.id, quizId);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => PaginatedQuizResponse, { nullable: true })
  async getQuizesByUser(
    @CurrentUser() user: PayloadDto,
    @Args('page', { type: () => Number, nullable: true }) offset?: number,
    @Args('pageSize', { type: () => Number, nullable: true }) limit?: number,
    @Args('sortBy', { type: () => String, nullable: true }) sortBy?: string,
  ) {
    return this.quizService.getQuizesByUser(user.id, offset, limit, sortBy);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => String, { nullable: true })
  async registerQuizProgress(
    @CurrentUser() user: PayloadDto,
    @Args('quizId') quizId: string,
    @Args('currentQuestionIndex', { type: () => Int })
    currentQuestionIndex: number,
    @Args({ name: 'questionsAndAnswers', type: () => [QuestionAndAnswer] })
    questionsAndAnswers: QuestionAndAnswer[],
  ) {
    const quizPartialInput: QuizPartialInput = {
      currentQuestionIndex,
      questionsAndAnswers,
    };

    return this.quizService.saveQuizProgressAsync(
      user.id,
      quizId,
      quizPartialInput,
    );
  }
}
