import { Field, ID, Int, ObjectType } from "@nestjs/graphql";
import GraphQLJSON from "graphql-type-json";
import { AIOutputEnum, AIOutputType } from "src/graphql/ai-output.graphql";
import { MaterialType } from "src/materials/materials.graphql";

@ObjectType()
export class QuizLatestResult {
  @Field()
  score: number;

  @Field(() => Date)
  completedAt: Date;
}

@ObjectType()
export class QuizOutputType extends AIOutputType{

  @Field({ nullable: true })
  averageScore?: number;

  @Field({ nullable: true })
  totalAttempts?: number;

  @Field({ nullable: true })
  averagePercentage?: number;

  @Field({ nullable: true })
  bestScore?: number;

  @Field(() => QuizLatestResult, { nullable: true })
  latestResult?: QuizLatestResult;
}

@ObjectType()
export class PaginatedQuizResponse {
  @Field(() => [QuizOutputType])
  data: QuizOutputType[];

  @Field(() => Int)
  totalItems: number;

  @Field(() => Int)
  totalPages: number;

  @Field(() => Int)
  currentPage: number;

  @Field(() => Int)
  pageSize: number;

  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;
}