import { Field, ObjectType } from "@nestjs/graphql";
import { FlashcardProgressType } from "./flashcard-progress.graphql";

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