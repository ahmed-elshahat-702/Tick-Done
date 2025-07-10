export interface PushSubscriptionJSON {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface TUser {
  _id: string;
  name: string;
  email: string;
  bio?: string;
  image?: string;
  hashedPassword?: string;
  authProvider?: string;
  pushSubscription?: PushSubscriptionJSON | null;
  createdAt: Date;
}

export type TUserUpdate = Partial<
  Pick<TUser, "name" | "email" | "image" | "bio">
>;
