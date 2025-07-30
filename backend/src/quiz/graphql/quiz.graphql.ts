import { Field, Int, ObjectType } from '@nestjs/graphql';
import { AIOutputType } from '../../graphql/ai-output.graphql';
import { PaginatedResponse } from '../../graphql/pagination.graphql';

@ObjectType()
export class QuizLatestResult {
  @Field()
  score: number;

  @Field(() => Date)
  completedAt: Date;
}

@ObjectType()
export class QuizOutputType extends AIOutputType {
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
export class PaginatedQuizResponse extends PaginatedResponse {
  @Field(() => [QuizOutputType])
  data: QuizOutputType[];
}

@ObjectType()
export class QuestionAndAnswers {
  @Field(() => Int)
  question: number;

  @Field(() => String)
  answer: string;

  @Field(() => Boolean)
  isCorrect: boolean;
}

@ObjectType()
export class QuizPartial {
  @Field(() => Int)
  currentQuestionIndex: number;

  @Field(() => [QuestionAndAnswers])
  questionsAndAnswers: QuestionAndAnswers[];
}

@ObjectType()
export class QuizWithPartialOutputType extends AIOutputType {
  @Field(() => QuizPartial, { nullable: true })
  partialData: QuizPartial;
}
