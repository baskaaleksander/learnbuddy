import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export abstract class PaginatedResponse {

    @Field(() => Int)
    totalItems: number;
    
    @Field(() => Int)
    totalPages: number;
    
    @Field(() => Int)
    currentPage: number;
    
    @Field(() => Int)
    pageSize: number;
    
    @Field(() => Boolean)
    hasNextPage: boolean;
    
    @Field(() => Boolean)
    hasPreviousPage: boolean;
}