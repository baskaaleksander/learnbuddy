import { Query, Resolver } from '@nestjs/graphql';
import { UserType } from './user.graphql';
import { UserService } from './user.service';
import { CurrentUser } from 'src/decorators/gql-current-user.decorator';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/guards/gql-auth.guard';

@Resolver(() => UserType)
export class UserResolver {
    constructor(private readonly userService: UserService) {}

    @UseGuards(GqlAuthGuard)
    @Query(() => UserType)
    async me(@CurrentUser() user) {
        return this.userService.getCurrentUser(user.id);
    }

    // @Query(() => [UserType], { name: 'users' })
    // async getAllUsers() {
    //     return await this.userService.getAllUsers();
    // }
}
