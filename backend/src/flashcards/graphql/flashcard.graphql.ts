import { Field, ObjectType } from '@nestjs/graphql';
import { AIOutputInterface } from '../../graphql/ai-output.graphql';
import { PaginatedResponse } from '../../graphql/pagination.graphql';

@ObjectType()
export class FlashcardType {
  @Field()
  id: string;

  @Field()
  aiOutputId: string;

  @Field()
  question: string;

  @Field()
  answer: string;

  @Field(() => Date)
  createdAt: Date;
}

@ObjectType()
export class FlashcardsWithStatsType extends AIOutputInterface {
  @Field()
  total: number;

  @Field()
  known: number;

  @Field()
  review: number;

  @Field(() => Date)
  lastUpdated: Date;
}

@ObjectType()
export class PaginatedFlashcardsWithStatsResponse extends PaginatedResponse {
  @Field(() => [FlashcardsWithStatsType])
  data: FlashcardsWithStatsType[];
}
