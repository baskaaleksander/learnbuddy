import { Field, Int, ObjectType } from '@nestjs/graphql';

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

  @Field(() => [QuizAnswerType]) // Changed from QuizAnswerType to [QuizAnswerType]
  answers: QuizAnswerType[];

  @Field()
  completedAt: Date;
}
