// Fetches jobs from free public job boards and company career pages, and turns
// each into the shape of our Job model. Every source is keyless; each card in
// the app links back to the source, as their terms ask.

const TIMEOUT_MS = 20000;
const USER_AGENT = "CareerPilot job import (+https://github.com/Ashu-1104/careerpilot)";

// Indian companies with public Greenhouse / Lever career boards.
const GREENHOUSE_BOARDS = {
    groww: "Groww",
    inmobi: "InMobi",
    druva: "Druva",
    hackerrank: "HackerRank",
    slice: "slice",
};
const LEVER_BOARDS = {
    paytm: "Paytm",
    meesho: "Meesho",
    cred: "CRED",
    zeta: "Zeta",
    mindtickle: "Mindtickle",
};

const INDIA_PLACES = [
    "india", "bengaluru", "bangalore", "mumbai", "pune", "delhi", "hyderabad",
    "gurgaon", "gurugram", "noida", "chennai", "kolkata", "ahmedabad", "jaipur", "kochi",
];

// Roles we import: software, data, design and product. Other roles are skipped.
const CATEGORY_RULES = [
    ["Design", /\b(designer|design|ux|ui\/ux|product design)\b/i],
    ["Engineering", /\b(engineer|engineering|developer|sde|devops|sre|architect|programmer|full[ -]?stack|frontend|front[ -]end|backend|back[ -]end|mobile|android|ios|qa|test automation)\b/i],
    ["IT & Software", /\b(data|machine learning|ml|ai|analyst|scientist|security|cloud|software|product manager|technical)\b/i],
];

const fetchJson = async (url) => {
    const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`${url} answered ${res.status}`);
    return res.json();
};

// HTML job descriptions to plain text, keeping paragraphs and list items readable.
const htmlToText = (html = "") =>
    String(html)
        .replace(/<\s*(br|\/p|\/div|\/h[1-6]|\/li|\/ul|\/ol)\s*\/?>/gi, "\n")
        .replace(/<\s*li[^>]*>/gi, "• ")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&rsquo;|&#8217;/g, "'")
        .replace(/&[a-z]+;|&#\d+;/gi, "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n\s*\n\s*(\n\s*)+/g, "\n\n")
        // list items wrapped in paragraphs: one line each, not a blank line between
        .replace(/(•[^\n]*)\n\s*\n(?=\s*•)/g, "$1\n")
        .replace(/•\s*\n\s*/g, "• ")
        .trim();

// Non-tech roles that would otherwise match a word like "AI" or "mobile".
const NON_TECH = /\b(sales|marketing|collections?|business development|account (manager|executive)|recruit(er|ing)?|talent acquisition|customer (success|support|service)|operations? (manager|executive|lead)|finance|legal|payroll|field|relationship manager|doctor|nurse|physician|lawyer|attorney|teacher|tutor|accounting|accountant|bookkeep(ing|er)|ai train(ing|er))\b/i;
// roles open only to people in another country
const OTHER_COUNTRY_ONLY = /\b(u\.?s\.?|usa|us|uk|eu|canada) (based|only)\b/i;

const categoryFor = (title = "") =>
    NON_TECH.test(title) || OTHER_COUNTRY_ONLY.test(title) ? undefined : CATEGORY_RULES.find(([, re]) => re.test(title))?.[0];

const typeFor = (text = "") => {
    if (/intern/i.test(text)) return "Internship";
    if (/contract|freelance/i.test(text)) return "Contract";
    if (/part[ -]?time/i.test(text)) return "Part-Time";
    return "Full-Time";
};

const inIndia = (location = "") => INDIA_PLACES.some((p) => location.toLowerCase().includes(p));
// company-board roles listed as just "Remote", with no country attached
const anyRemote = (location = "") => /^\s*remote\s*$/i.test(location || "");
// remote roles that do not exclude candidates in India
const openToIndia = (restriction = "") =>
    !restriction || /worldwide|anywhere|global|asia|apac|india/i.test(restriction);

// "Remote (India)" when India is allowed, otherwise a short list of where.
const remoteLabel = (places = []) => {
    const list = (Array.isArray(places) ? places : String(places).split(/,\s*/)).filter(Boolean);
    if (!list.length || list.some((p) => /worldwide|anywhere/i.test(p))) return "Remote (Worldwide)";
    if (list.some((p) => /india/i.test(p))) return "Remote (India)";
    return `Remote (${list.slice(0, 2).join(", ")}${list.length > 2 ? ` +${list.length - 2} more` : ""})`;
};

const job = (fields) => {
    const category = categoryFor(fields.title);
    if (!category || !fields.applyUrl || !fields.externalId) return null;
    return {
        ...fields,
        externalId: String(fields.externalId),
        description: htmlToText(fields.description).slice(0, 20000) || fields.title,
        category,
        type: fields.type || typeFor(fields.title),
        tags: (fields.tags || []).map(String).slice(0, 12),
    };
};

const sources = {
    async remotive() {
        const data = await fetchJson("https://remotive.com/api/remote-jobs?category=software-dev");
        return data.jobs
            .filter((j) => openToIndia(j.candidate_required_location))
            .map((j) => job({
                source: "remotive",
                externalId: j.id,
                title: j.title,
                companyName: j.company_name,
                companyLogoUrl: j.company_logo,
                location: remoteLabel(j.candidate_required_location),
                type: j.job_type === "contract" ? "Contract" : j.job_type === "part_time" ? "Part-Time" : "Full-Time",
                description: j.description,
                applyUrl: j.url,
                tags: j.tags,
                postedAt: j.publication_date,
            }));
    },

    async remoteok() {
        const data = await fetchJson("https://remoteok.com/api");
        return data
            .filter((j) => j.id && openToIndia(j.location))
            .map((j) => job({
                source: "remoteok",
                externalId: j.id,
                title: j.position,
                companyName: j.company,
                companyLogoUrl: j.company_logo || j.logo,
                location: remoteLabel(j.location),
                description: j.description,
                applyUrl: j.url,
                tags: j.tags,
                salaryMin: j.salary_min || undefined,
                salaryMax: j.salary_max || undefined,
                postedAt: j.date,
            }));
    },

    async himalayas() {
        // the API returns 20 jobs per page
        const pages = await Promise.allSettled(
            [1, 2, 3, 4, 5].map((page) =>
                fetchJson(`https://himalayas.app/jobs/api/search?country=India&sort=recent&page=${page}`)
            )
        );
        const jobs = pages.flatMap((p) => (p.status === "fulfilled" ? p.value.jobs || [] : []));
        return jobs.map((j) => job({
            source: "himalayas",
            externalId: j.guid || j.applicationLink,
            title: j.title,
            companyName: j.companyName,
            companyLogoUrl: j.companyLogo,
            location: remoteLabel(j.locationRestrictions),
            type: typeFor(j.employmentType),
            description: j.description || j.excerpt,
            applyUrl: j.applicationLink,
            tags: j.categories,
            postedAt: j.pubDate ? new Date(j.pubDate * 1000) : undefined,
        }));
    },

    async greenhouse() {
        const boards = await Promise.allSettled(
            Object.entries(GREENHOUSE_BOARDS).map(async ([board, companyName]) => {
                const data = await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`);
                return data.jobs
                    .filter((j) => inIndia(j.location?.name) || anyRemote(j.location?.name))
                    .map((j) => job({
                        source: "greenhouse",
                        externalId: `${board}-${j.id}`,
                        title: j.title,
                        companyName,
                        location: j.location?.name,
                        description: j.content?.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&"),
                        applyUrl: j.absolute_url,
                        postedAt: j.updated_at,
                    }));
            })
        );
        return boards.flatMap((b) => (b.status === "fulfilled" ? b.value : []));
    },

    async lever() {
        const boards = await Promise.allSettled(
            Object.entries(LEVER_BOARDS).map(async ([board, companyName]) => {
                const data = await fetchJson(`https://api.lever.co/v0/postings/${board}?mode=json`);
                return data
                    .filter((j) => inIndia(j.categories?.location) || anyRemote(j.categories?.location))
                    .map((j) => job({
                        source: "lever",
                        externalId: `${board}-${j.id}`,
                        title: j.text,
                        companyName,
                        location: j.categories?.location,
                        type: typeFor(`${j.categories?.commitment || ""} ${j.text}`),
                        description: [j.descriptionPlain, ...(j.lists || []).map((l) => `${l.text}\n${htmlToText(l.content)}`)].join("\n\n"),
                        applyUrl: j.hostedUrl,
                        tags: [j.categories?.team, j.categories?.department].filter(Boolean),
                        postedAt: j.createdAt ? new Date(j.createdAt) : undefined,
                    }));
            })
        );
        return boards.flatMap((b) => (b.status === "fulfilled" ? b.value : []));
    },
};

// Where each source's jobs come from, shown as "via ..." on the job cards.
const SOURCE_INFO = {
    remotive: { name: "Remotive", url: "https://remotive.com" },
    remoteok: { name: "Remote OK", url: "https://remoteok.com" },
    himalayas: { name: "Himalayas", url: "https://himalayas.app" },
    greenhouse: { name: "Company careers page", url: null },
    lever: { name: "Company careers page", url: null },
};

module.exports = { sources, SOURCE_INFO, htmlToText, categoryFor, typeFor, openToIndia, inIndia, remoteLabel };
