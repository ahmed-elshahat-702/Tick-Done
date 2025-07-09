export { auth as middleware } from "./auth";

export const config = {
  // Adjust the matcher to protect all routes except auth and public ones
  matcher: ["/((?!api/auth|_next/static|favicon.ico).*)"],
};
