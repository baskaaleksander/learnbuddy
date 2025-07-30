import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { SummaryService } from './summary.service';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { CurrentUser } from '../decorators/gql-current-user.decorator';
import { PayloadDto } from '../auth/dtos/payload.dto';
import { PaginatedSummaryType, SummaryType } from './graphql/summary.graphql';

@Resolver(() => SummaryType)
export class SummaryResolver {
  constructor(private readonly summaryService: SummaryService) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => SummaryType, { nullable: true })
  async getSummaryByMaterial(
    @Args('materialId') materialId: string,
    @CurrentUser() user: PayloadDto,
  ) {
    return this.summaryService.getSummaryByMaterial(materialId, user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => SummaryType, { nullable: true })
  async getSummaryById(
    @Args('id') id: string,
    @CurrentUser() user: PayloadDto,
  ) {
    return this.summaryService.getSummaryById(id, user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async markChapterAsKnown(
    @Args('id') id: string,
    @Args('chapterIndex') chapterIndex: number,
    @CurrentUser() user: PayloadDto,
  ) {
    return this.summaryService.markChapterAsKnown(id, chapterIndex, user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async markChapterAsImportant(
    @Args('id') id: string,
    @Args('chapterIndex') chapterIndex: number,
    @CurrentUser() user: PayloadDto,
  ) {
    return this.summaryService.markChapterAsImportant(
      id,
      chapterIndex,
      user.id,
    );
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async createSummary(
    @Args('materialId') materialId: string,
    @CurrentUser() user: PayloadDto,
  ) {
    return this.summaryService.createSummary(materialId, user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async deleteSummary(@Args('id') id: string, @CurrentUser() user: PayloadDto) {
    return this.summaryService.deleteSummary(id, user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => PaginatedSummaryType, { nullable: true })
  async getSummariesByUser(
    @CurrentUser() user: PayloadDto,
    @Args('page', { type: () => Number, nullable: true }) page?: number,
    @Args('pageSize', { type: () => Number, nullable: true }) pageSize?: number,
    @Args('sortBy', { type: () => String, nullable: true }) sortBy?: string,
  ) {
    return this.summaryService.getSummariesByUser(
      user.id,
      page,
      pageSize,
      sortBy,
    );
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async regenerateSummary(
    @Args('materialId') materialId: string,
    @CurrentUser() user: PayloadDto,
  ) {
    return this.summaryService.regenerateSummary(materialId, user.id);
  }
}
