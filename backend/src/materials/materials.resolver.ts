import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MaterialType } from './materials.graphql';
import { MaterialsService } from './materials.service';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/guards/gql-auth.guard';
import { CurrentUser } from 'src/decorators/gql-current-user.decorator';
import { PayloadDto } from 'src/auth/dtos/payload.dto';
import { CreateMaterialInput } from './dtos/create-material.input';

@Resolver(() => MaterialType) 
export class MaterialsResolver {
    constructor(private readonly materialsService: MaterialsService) {}

    @Query(() => [MaterialType])
    async getAllMaterials() {
        return await this.materialsService.getAllMaterials();
    }

    @UseGuards(GqlAuthGuard)
    @Query(() => MaterialType)
    async getUserMaterials(@CurrentUser() user: PayloadDto) {
        return await this.materialsService.getUserMaterials(user.id);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => MaterialType)
    async createMaterial(@CurrentUser() user: PayloadDto, @Args('input') input: CreateMaterialInput) {
        return await this.materialsService.createMaterial(user.id, input);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation()
    async deleteMaterial(@CurrentUser() user: PayloadDto, @Args('id') id: string) {
        return await this.materialsService.deleteMaterial(user.id, id);
    }

}
