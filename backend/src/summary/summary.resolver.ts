import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { SummaryService } from './summary.service';
import { AIOutputType } from 'src/graphql/ai-output.graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/guards/gql-auth.guard';
import { CurrentUser } from 'src/decorators/gql-current-user.decorator';
import { PayloadDto } from 'src/auth/dtos/payload.dto';

@Resolver(() => AIOutputType)
export class SummaryResolver {
    constructor(private readonly summaryService: SummaryService) {}

    @UseGuards(GqlAuthGuard)
    @Query(() => AIOutputType, { nullable: true })
    async getSummaryByMaterial(@Args('materialId') materialId: string, @CurrentUser() user: PayloadDto) {
        return this.summaryService.getSummaryByMaterial(materialId, user.id);
    }

    @UseGuards(GqlAuthGuard)
    @Query(() => AIOutputType, { nullable: true })
    async getSummaryById(@Args('id') id: string, @CurrentUser() user: PayloadDto) {
        return this.summaryService.getSummaryById(id, user.id);
    }


    @UseGuards(GqlAuthGuard)
    @Mutation(() => Boolean)
    async createSummary(@Args('materialId') materialId: string, @CurrentUser() user: PayloadDto) {
        return this.summaryService.createSummary(materialId, user.id);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => Boolean)
    async deleteSummary(@Args('id') id: string, @CurrentUser() user: PayloadDto) {
        return this.summaryService.deleteSummary(id, user.id);
    }


}
