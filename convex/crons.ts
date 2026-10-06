import { cronJobs } from "convex/server";

const crons = cronJobs();

/**
 * Scheduled Platform Synchronization (Section 24)
 *
 * Periodic background synchronization runs via Convex crons.
 * Avoids uncontrolled parallel provider requests by running in serialized batches.
 */

export default crons;
