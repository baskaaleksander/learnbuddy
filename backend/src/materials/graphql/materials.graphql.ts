import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { AIOutputType } from 'src/graphql/ai-output.graphql';
import { PaginatedResponse } from 'src/graphql/pagination.graphql';

export enum MaterialStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

registerEnumType(MaterialStatus, {
  name: 'MaterialStatus',
});

@ObjectType()
export class MaterialType {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field(() => String)
  content: string;

  @Field(() => MaterialStatus)
  status: MaterialStatus;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class PaginatedMaterialsResponse extends PaginatedResponse {
  @Field(() => [MaterialType])
  data: MaterialType[];
}

@ObjectType()
export class MaterialWithAiOutputType {
  @Field(() => MaterialType)
  material: MaterialType;

  @Field(() => [AIOutputType])
  ai_outputs: AIOutputType[];
}
