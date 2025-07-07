import { Args, Query, Resolver } from '@nestjs/graphql';
import { StatsService } from './stats.service';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { FlashcardStats } from '../flashcards/graphql/flashcard-progress.graphql';
import { CurrentUser } from '../decorators/gql-current-user.decorator';
import { PayloadDto } from '../auth/dtos/payload.dto';
import { UserStats } from './graphql/stats.graphql';

@Resolver()
export class StatsResolver {
  constructor(private readonly statsService: StatsService) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => FlashcardStats)
  async getFlashcardStatsByMaterial(
    @Args('materialId') materialId: string,
    @CurrentUser() user: PayloadDto,
  ) {
    return this.statsService.getFlashcardStats(materialId, user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => UserStats)
  async getUserStats(@CurrentUser() user: PayloadDto) {
    return this.statsService.getUserStats(user.id);
  }
}
