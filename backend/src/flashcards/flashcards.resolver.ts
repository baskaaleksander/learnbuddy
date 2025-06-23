import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PayloadDto } from 'src/auth/dtos/payload.dto';
import { CurrentUser } from 'src/decorators/gql-current-user.decorator';
import { AIOutputType } from 'src/graphql/ai-output.graphql';
import { FlashcardsService } from './flashcards.service';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/guards/gql-auth.guard';
import {
  FlashcardProgressStatus,
  FlashcardStats,
} from './flashcard-progress.graphql';
import {
  FlashcardType,
  PaginatedFlashcardsWithStatsResponse,
} from './flashcard.graphql';
import { FlashcardWithProgressType } from './flashcard-with-progress.graphql';

@Resolver(() => AIOutputType)
export class FlashcardsResolver {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => AIOutputType)
  async getFlashcardById(
    @Args('id') id: string,
    @CurrentUser() user: PayloadDto,
  ) {
    return this.flashcardsService.getFlashcardById(id, user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => PaginatedFlashcardsWithStatsResponse)
  async getFlashcardsSetsByUser(
    @CurrentUser() user: PayloadDto,
    @Args('page') page: number,
    @Args('pageSize') pageSize: number,
    @Args('sortBy', { type: () => String, nullable: true }) sortBy?: string,
  ) {
    return this.flashcardsService.getFlashcardsSetsByUser(
      user.id,
      page,
      pageSize,
      sortBy,
    );
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [FlashcardType])
  async getFlashcardsByMaterial(
    @Args('materialId') materialId: string,
    @CurrentUser() user: PayloadDto,
  ) {
    return this.flashcardsService.getFlashcardsByMaterial(materialId, user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async createFlashcard(
    @Args('materialId') materialId: string,
    @CurrentUser() user: PayloadDto,
  ) {
    return this.flashcardsService.createFlashcards(materialId, user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async regenerateFlashcards(
    @Args('materialId') materialId: string,
    @CurrentUser() user: PayloadDto,
  ) {
    return this.flashcardsService.regenerateFlashcards(materialId, user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async deleteFlashcard(
    @Args('id') id: string,
    @CurrentUser() user: PayloadDto,
  ) {
    return this.flashcardsService.deleteFlashcards(id, user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async updateFlashcardProgress(
    @Args('id') id: string,
    @Args('status') status: FlashcardProgressStatus,
    @CurrentUser() user: PayloadDto,
  ) {
    return this.flashcardsService.updateFlashcardStatus(id, user.id, status);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [FlashcardWithProgressType])
  async getFlashcardProgressByMaterial(
    @Args('materialId') materialId: string,
    @CurrentUser() user: PayloadDto,
  ) {
    return this.flashcardsService.getFlashcardProgressByMaterial(
      materialId,
      user.id,
    );
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => FlashcardStats)
  async getFlashcardStatsByMaterial(
    @Args('materialId') materialId: string,
    @CurrentUser() user: PayloadDto,
  ) {
    return this.flashcardsService.getFlashcardStats(materialId, user.id);
  }
}
