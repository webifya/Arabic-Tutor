import NextAuth from "next-auth";

import { getAuthOptions } from "@/lib/auth/options";

async function handler(request: Request) {
  const authHandler = NextAuth(await getAuthOptions());
  return authHandler(request);
}

export { handler as GET, handler as POST };
