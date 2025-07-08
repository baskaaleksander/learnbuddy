import { Field, ID, InterfaceType, registerEnumType } from '@nestjs/graphql';
import { MaterialType } from 'src/materials/graphql/materials.graphql';
import GraphQLJSON from 'graphql-type-json';

export enum AIOutputEnum {
  SUMMARY = 'summary',
  FLASHCARDS = 'flashcards',
  QUIZ = 'quiz',
}

registerEnumType(AIOutputEnum, {
  name: 'AIOutputEnum',
  description: 'Types of AI-generated content',
});

@InterfaceType()
export abstract class AIOutputType {
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
}
