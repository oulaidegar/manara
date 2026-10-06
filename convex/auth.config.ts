const domain =
  process.env.CLERK_JWT_ISSUER_DOMAIN ||
  "https://striking-vulture-2486.clerk.accounts.dev";

const authConfig = {
  providers: [
    {
      domain,
      applicationID: "convex",
    },
    {
      type: "customJwt" as const,
      issuer: domain,
      jwks: `${domain}/.well-known/jwks.json`,
      algorithm: "RS256" as const,
    },
  ],
};

export default authConfig;

