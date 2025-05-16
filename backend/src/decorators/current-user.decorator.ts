import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PayloadDto } from 'src/auth/dtos/payload.dto';


export const CurrentUser = createParamDecorator(
  (data: keyof PayloadDto | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    
    if (!request.user) {
      return null;
    }
    
    if (data) {
      return request.user[data];
    }
    
    return request.user;
  },
);