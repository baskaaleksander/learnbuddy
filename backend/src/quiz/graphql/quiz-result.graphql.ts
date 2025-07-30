import { Field, Int, ObjectType } from '@nestjs/graphql';
import { PaginatedResponse } from '../../graphql/pagination.graphql';

@ObjectType()
export class QuizAnswerType {
  @Field(() => Int)
  question: number;

  @Field(() => String)
  answer: string;

  @Field(() => Boolean)
  isCorrect: boolean;
}

@ObjectType()
export class QuizResultType {
  @Field()
  id: string;

  @Field()
  userId: string;

  @Field()
  materialId: string;

  @Field()
  aiOutputId: string;

  @Field(() => Int)
  score: number;

  @Field(() => Int)
  totalQuestions: number;

  @Field(() => [String])
  correctAnswers: string[];

  @Field(() => [QuizAnswerType])
  answers: QuizAnswerType[];

  @Field()
  completedAt: Date;
}

@ObjectType()
export class PaginatedQuizResultType extends PaginatedResponse {
  @Field(() => [QuizResultType])
  data: QuizResultType[];
}
