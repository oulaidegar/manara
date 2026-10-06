/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as connectors_accounts from "../connectors/accounts.js";
import type * as connectors_linkedin_index from "../connectors/linkedin/index.js";
import type * as connectors_meta_index from "../connectors/meta/index.js";
import type * as connectors_shared_types from "../connectors/shared/types.js";
import type * as connectors_sync from "../connectors/sync.js";
import type * as connectors_tiktok_index from "../connectors/tiktok/index.js";
import type * as connectors_youtube_index from "../connectors/youtube/index.js";
import type * as content from "../content.js";
import type * as crons from "../crons.js";
import type * as impact from "../impact.js";
import type * as imports from "../imports.js";
import type * as initiatives from "../initiatives.js";
import type * as lib_audit from "../lib/audit.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_errors from "../lib/errors.js";
import type * as metrics from "../metrics.js";
import type * as organizations_members from "../organizations/members.js";
import type * as organizations_mutations from "../organizations/mutations.js";
import type * as organizations_queries from "../organizations/queries.js";
import type * as practices from "../practices.js";
import type * as reports from "../reports.js";
import type * as seed from "../seed.js";
import type * as tags from "../tags.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  "connectors/accounts": typeof connectors_accounts;
  "connectors/linkedin/index": typeof connectors_linkedin_index;
  "connectors/meta/index": typeof connectors_meta_index;
  "connectors/shared/types": typeof connectors_shared_types;
  "connectors/sync": typeof connectors_sync;
  "connectors/tiktok/index": typeof connectors_tiktok_index;
  "connectors/youtube/index": typeof connectors_youtube_index;
  content: typeof content;
  crons: typeof crons;
  impact: typeof impact;
  imports: typeof imports;
  initiatives: typeof initiatives;
  "lib/audit": typeof lib_audit;
  "lib/auth": typeof lib_auth;
  "lib/errors": typeof lib_errors;
  metrics: typeof metrics;
  "organizations/members": typeof organizations_members;
  "organizations/mutations": typeof organizations_mutations;
  "organizations/queries": typeof organizations_queries;
  practices: typeof practices;
  reports: typeof reports;
  seed: typeof seed;
  tags: typeof tags;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
