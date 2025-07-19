import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  MaterialType,
  PaginatedMaterialsResponse,
} from './graphql/materials.graphql';
import { MaterialsService } from './materials.service';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/guards/gql-auth.guard';
import { CurrentUser } from 'src/decorators/gql-current-user.decorator';
import { PayloadDto } from 'src/auth/dtos/payload.dto';
import { CreateMaterialInput } from './dtos/create-material.input';
import { EditMaterialInput } from './dtos/edit-material.input';

@Resolver(() => MaterialType)
export class MaterialsResolver {
  constructor(private readonly materialsService: MaterialsService) {}

  @Query(() => [MaterialType])
  async getAllMaterials() {
    return await this.materialsService.getAllMaterials();
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => PaginatedMaterialsResponse)
  async getUserMaterials(
    @CurrentUser() user: PayloadDto,
    @Args('page') page: number,
    @Args('pageSize') pageSize: number,
    @Args('sortBy', { type: () => String, nullable: true }) sortBy?: string,
    @Args('status', { type: () => String, nullable: true })
    status?: 'pending' | 'processed' | 'failed' | 'all',
  ) {
    return await this.materialsService.getUserMaterials(
      user.id,
      page,
      pageSize,
      sortBy,
      status,
    );
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => MaterialType, { nullable: true })
  async getMaterialById(
    @Args('id') id: string,
    @CurrentUser() user: PayloadDto,
  ) {
    return await this.materialsService.getMaterialById(id, user.id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => MaterialType)
  async createMaterial(
    @CurrentUser() user: PayloadDto,
    @Args('input') input: CreateMaterialInput,
  ) {
    return await this.materialsService.createMaterial(user.id, input);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async deleteMaterial(
    @CurrentUser() user: PayloadDto,
    @Args('id') id: string,
  ) {
    return await this.materialsService.deleteMaterial(user.id, id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async updateMaterial(
    @CurrentUser() user: PayloadDto,
    @Args('input') input: EditMaterialInput,
  ) {
    return await this.materialsService.updateMaterial(user.id, input);
  }
}
