import { Module } from '@nestjs/common';
import { MaterialsResolver } from './materials.resolver';
import { MaterialsService } from './materials.service';

@Module({
  providers: [MaterialsResolver, MaterialsService]
})
export class MaterialsModule {}
