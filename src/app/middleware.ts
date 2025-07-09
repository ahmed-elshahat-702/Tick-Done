export { auth as middleware } from "./auth";

export const config = {
  matcher: ["/((?!auth/signin|auth/signup|auth/error).*)"],
};
