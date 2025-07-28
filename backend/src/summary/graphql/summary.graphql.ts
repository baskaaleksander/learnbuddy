import { Field, ObjectType } from '@nestjs/graphql';
import { AIOutputType } from 'src/graphql/ai-output.graphql';
import { PaginatedResponse } from '../graphql/pagination.graphql';

@ObjectType()
export class SummaryType extends AIOutputType {
  @Field(() => String)
  title: string;

  @Field(() => Number)
  chaptersCount: number;

  @Field(() => Number)
  bulletPointsCount: number;
}

@ObjectType()
export class PaginatedSummaryType extends PaginatedResponse {
  @Field(() => [SummaryType])
  data: SummaryType[];
}
