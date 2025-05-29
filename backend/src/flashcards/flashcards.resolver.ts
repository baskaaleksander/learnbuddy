import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PayloadDto } from 'src/auth/dtos/payload.dto';
import { CurrentUser } from 'src/decorators/gql-current-user.decorator';
import { AIOutputType } from 'src/graphql/ai-output.graphql';

@Resolver(() => AIOutputType)
export class FlashcardsResolver {
    @Query(() => AIOutputType)
    async getFlashcardById(@Args('id') id: string, @CurrentUser() user: PayloadDto) {
        // Logic to fetch a flashcard by ID
        return null; // Placeholder return
    }

    @Query(() => [AIOutputType])
    async getFlashcardsByMaterial(@Args('materialId') materialId: string, @CurrentUser() user: PayloadDto) {
        // Logic to fetch flashcards by material ID
        return []; // Placeholder return
    }

    @Mutation(() => Boolean)
    async createFlashcard(
        @Args('materialId') materialId: string,
        @CurrentUser() user: PayloadDto
    ) {
        // Logic to create a flashcard
        return true; // Placeholder return
    }

    @Mutation(() => Boolean)
    async deleteFlashcard(@Args('id') id: string, @CurrentUser() user: PayloadDto) {
        // Logic to delete a flashcard
        return true; // Placeholder return
    }
}
