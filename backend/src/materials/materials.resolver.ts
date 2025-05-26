import { Query, Resolver } from '@nestjs/graphql';
import { MaterialType } from './materials.graphql';
import { MaterialsService } from './materials.service';

@Resolver(() => MaterialType) 
export class MaterialsResolver {
    constructor(private readonly materialsService: MaterialsService) {}

    @Query(() => [MaterialType])
    async getAllMaterials() {
        return await this.materialsService.getAllMaterials();
    }
}
