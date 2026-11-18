const Job = require("../models/Job");
const { sources } = require("./jobSources");

// imported jobs not seen in any import for this long are closed
const STALE_DAYS = 3;

// Fetches every source and saves its jobs. A failing source is reported and
// skipped; it never stops the others or closes their jobs.
exports.importJobs = async () => {
    const startedAt = new Date();
    const report = {};

    const results = await Promise.allSettled(
        Object.entries(sources).map(async ([name, fetchJobs]) => {
            const jobs = (await fetchJobs()).filter(Boolean);
            if (jobs.length) {
                await Job.bulkWrite(
                    jobs.map(({ postedAt, ...job }) => ({
                        updateOne: {
                            filter: { source: job.source, externalId: job.externalId },
                            update: {
                                $set: { ...job, isClosed: false, lastSeenAt: startedAt },
                                $setOnInsert: { postedAt: postedAt ? new Date(postedAt) : startedAt },
                            },
                            upsert: true,
                        },
                    })),
                    { ordered: false }
                );
            }
            return [name, jobs.length];
        })
    );

    const okSources = [];
    results.forEach((r, i) => {
        const name = Object.keys(sources)[i];
        if (r.status === "fulfilled") {
            report[name] = r.value[1];
            okSources.push(name);
        } else {
            report[name] = `failed: ${r.reason?.message || r.reason}`;
        }
    });

    const staleBefore = new Date(startedAt.getTime() - STALE_DAYS * 24 * 60 * 60 * 1000);
    const closed = await Job.updateMany(
        { source: { $in: okSources }, isClosed: false, lastSeenAt: { $lt: staleBefore } },
        { $set: { isClosed: true } }
    );
    report.closedStale = closed.modifiedCount;
    return report;
};
