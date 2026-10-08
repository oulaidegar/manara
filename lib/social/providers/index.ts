import { SocialProvider } from "../types";
import { SocialCrawlProvider } from "./socialcrawl";

const providers: Record<string, SocialProvider> = {
  socialcrawl: new SocialCrawlProvider(),
};

export function getSocialProvider(name: string = "socialcrawl"): SocialProvider {
  const provider = providers[name.toLowerCase()];
  if (!provider) {
    // Default to SocialCrawl as primary provider per Section 12
    return providers.socialcrawl;
  }
  return provider;
}

export { SocialCrawlProvider };
