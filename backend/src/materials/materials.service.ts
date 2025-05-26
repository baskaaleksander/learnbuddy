import { Inject, Injectable } from '@nestjs/common';
import { db } from 'src/database/drizzle.module';
import { materials } from 'src/database/schema';
import { toMaterialGraphQL } from './materials.mapper';

@Injectable()
export class MaterialsService {

    constructor(@Inject('DRIZZLE') private drizzle: typeof db) {}

    async getAllMaterials() {
        const allMaterials = await this.drizzle.select().from(materials);

        return allMaterials.map(material => (toMaterialGraphQL(material)));
    }
}
