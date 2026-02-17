import { User, Board, BoardRole, BoardMember } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      board?: Board & { 
        members: (BoardMember & {
          user: {
            id: string;
            name: string;
            email: string;
          };
        })[];
      };
      isOwner?: boolean;
      memberRole?: BoardRole;
    }
  }
}

export {};
