import { Field, ID, ObjectType } from "@nestjs/graphql";
import GraphQLJSON from "graphql-type-json";
import { AIOutputEnum } from "src/graphql/ai-output.graphql";
import { MaterialType } from "src/materials/materials.graphql";

@ObjectType()
export class QuizLatestResult {
  @Field()
  score: number;

  @Field(() => Date)
  completedAt: Date;
}

@ObjectType()
export class QuizOutputType {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  materialId: string;

  @Field(() => AIOutputEnum)
  type: AIOutputEnum;

  @Field(() => GraphQLJSON)
  content: any;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => String, { nullable: true })
  errorMessage?: string;

  @Field(() => MaterialType, { nullable: true })
  material?: MaterialType;

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