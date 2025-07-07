export interface TUser {
  _id: string;
  name: string;
  email: string;
  bio?: string;
  image?: string;
  hashedPassword?: string;
  authProvider?: string;
  createdAt: Date;
}

export type TUserUpdate = Partial<
  Pick<TUser, "name" | "email" | "image" | "bio">
>;
