import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PayloadDto } from 'src/auth/dtos/payload.dto';
import { CurrentUser } from 'src/decorators/gql-current-user.decorator';
import { AIOutputType } from 'src/graphql/ai-output.graphql';
import { QuizService } from './quiz.service';

@Resolver(() => AIOutputType)
export class QuizResolver {
    constructor(
        private readonly quizService: QuizService,
    ) {}

    @Query(() => AIOutputType, { nullable: true })
    async getQuizById(
        @CurrentUser() user: PayloadDto, 
        @Args('id') id: string
    ) {
        return this.quizService.getQuizById(id, user.id);
    }

    @Query(() => [AIOutputType])
    async getQuizzesByMaterial(
        @CurrentUser() user: PayloadDto,
        @Args('materialId') materialId: string
    ) {
        return this.quizService.getQuizesByMaterial(materialId, user.id);
    }

    @Mutation(() => Boolean)
    async createQuiz(
        @CurrentUser() user: PayloadDto, 
        @Args('materialId') materialId: string, 
    ) {
        return this.quizService.createQuiz(materialId, user.id);
    }

    @Mutation(() => Boolean)
    async deleteQuiz(
        @CurrentUser() user: PayloadDto, 
        @Args('id') id: string
    ) {
        return this.quizService.deleteQuiz(id, user.id);
    }
}
