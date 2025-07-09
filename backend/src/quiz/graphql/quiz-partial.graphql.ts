import { Field, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
export class QuizPartialType {
  @Field(() => String)
  id: string;

  @Field(() => String)
  userId: string;

  @Field(() => String)
  quizId: string;

  @Field(() => Number)
  currentQuestionIndex: number;

  @Field(() => GraphQLJSON)
  answers: JSON;

  @Field(() => Date)
  lastUpdated: Date;

  @Field(() => Date)
  createdAt: Date;
}
