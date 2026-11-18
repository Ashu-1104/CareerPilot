// A dictionary of tech skills and the ways people write them, used to read
// skills out of resumes and job descriptions without any AI. Each entry:
// canonical name -> alternative spellings (matched case-insensitively, as whole words).
const SKILLS = {
    // languages
    JavaScript: ["javascript", "js", "es6", "ecmascript"],
    TypeScript: ["typescript", "ts"],
    Python: ["python"],
    Java: ["java"],
    Kotlin: ["kotlin"],
    Swift: ["swift"],
    Go: ["go", "golang", "go lang"],
    Rust: ["rust"],
    "C++": ["c\\+\\+", "cpp"],
    "C#": ["c#", "csharp"],
    C: ["c programming", "ansi c"],
    PHP: ["php"],
    Ruby: ["ruby"],
    Scala: ["scala"],
    Dart: ["dart"],
    SQL: ["sql"],
    Bash: ["bash", "shell scripting", "shell script"],
    Perl: ["perl"],
    R: ["r programming", "r language"],
    // frontend
    React: ["react", "react\\.js", "reactjs"],
    "React Native": ["react native", "react-native"],
    "Next.js": ["next\\.js", "nextjs", "next js"],
    Redux: ["redux", "redux toolkit", "rtk"],
    "Vue.js": ["vue", "vue\\.js", "vuejs"],
    Angular: ["angular", "angularjs"],
    Svelte: ["svelte", "sveltekit"],
    HTML: ["html", "html5"],
    CSS: ["css", "css3"],
    "Tailwind CSS": ["tailwind", "tailwindcss", "tailwind css"],
    Sass: ["sass", "scss"],
    Bootstrap: ["bootstrap"],
    "Material UI": ["material ui", "material-ui", "mui"],
    jQuery: ["jquery"],
    Vite: ["vite"],
    Webpack: ["webpack"],
    "Framer Motion": ["framer motion", "framer-motion"],
    "Three.js": ["three\\.js", "threejs"],
    Flutter: ["flutter"],
    // backend
    "Node.js": ["node", "node\\.js", "nodejs"],
    "Express.js": ["express", "express\\.js", "expressjs"],
    NestJS: ["nestjs", "nest\\.js"],
    Django: ["django"],
    Flask: ["flask"],
    FastAPI: ["fastapi"],
    "Spring Boot": ["spring boot", "springboot", "spring"],
    Laravel: ["laravel"],
    "Ruby on Rails": ["rails", "ruby on rails"],
    ".NET": ["\\.net", "dotnet", "asp\\.net"],
    GraphQL: ["graphql", "apollo"],
    "REST APIs": ["rest", "restful", "rest api", "rest apis"],
    gRPC: ["grpc"],
    WebSockets: ["websocket", "websockets", "socket\\.io"],
    Microservices: ["microservices", "microservice"],
    // data stores
    MongoDB: ["mongodb", "mongo", "mongoose"],
    PostgreSQL: ["postgresql", "postgres"],
    MySQL: ["mysql", "mariadb"],
    Redis: ["redis"],
    Elasticsearch: ["elasticsearch", "elastic search", "opensearch"],
    DynamoDB: ["dynamodb"],
    Firebase: ["firebase", "firestore"],
    Supabase: ["supabase"],
    Prisma: ["prisma"],
    Kafka: ["kafka"],
    RabbitMQ: ["rabbitmq"],
    Cassandra: ["cassandra"],
    // cloud & devops
    AWS: ["aws", "amazon web services", "ec2", "s3", "lambda"],
    GCP: ["gcp", "google cloud"],
    Azure: ["azure"],
    Docker: ["docker", "containers"],
    Kubernetes: ["kubernetes", "k8s", "eks", "gke"],
    Terraform: ["terraform"],
    "CI/CD": ["ci/cd", "ci cd", "continuous integration", "github actions", "jenkins", "gitlab ci"],
    Linux: ["linux", "unix", "ubuntu", "centos"],
    Nginx: ["nginx"],
    Apache: ["apache"],
    Git: ["git", "github", "gitlab", "bitbucket"],
    Vercel: ["vercel"],
    // testing & quality
    Jest: ["jest"],
    Vitest: ["vitest"],
    Cypress: ["cypress"],
    Playwright: ["playwright"],
    Selenium: ["selenium"],
    "Unit testing": ["unit testing", "unit tests", "tdd"],
    // data & ML
    "Machine Learning": ["machine learning", "ml"],
    "Deep Learning": ["deep learning"],
    TensorFlow: ["tensorflow"],
    PyTorch: ["pytorch"],
    "scikit-learn": ["scikit-learn", "sklearn"],
    Pandas: ["pandas"],
    NumPy: ["numpy"],
    LLMs: ["llm", "llms", "large language models", "genai", "generative ai", "openai", "langchain", "rag"],
    NLP: ["nlp", "natural language processing"],
    "Computer Vision": ["computer vision", "opencv"],
    Spark: ["spark", "pyspark"],
    Airflow: ["airflow"],
    "Data Analysis": ["data analysis", "data analytics"],
    Tableau: ["tableau"],
    "Power BI": ["power bi", "powerbi"],
    Excel: ["excel"],
    // practices & other
    "System Design": ["system design", "distributed systems", "scalability"],
    "Data Structures": ["data structures", "algorithms", "dsa"],
    Agile: ["agile", "scrum", "kanban"],
    Security: ["security", "owasp", "penetration testing", "appsec", "firewall"],
    Figma: ["figma"],
    "UI/UX": ["ui/ux", "ux design", "ui design", "user experience"],
    Android: ["android"],
    iOS: ["ios"],
    Blockchain: ["blockchain", "web3", "solidity"],
};

// Knowing the first means knowing the second (applied to resumes only).
const IMPLIES = {
    TypeScript: ["JavaScript"],
    React: ["JavaScript"],
    "Next.js": ["React", "JavaScript"],
    "React Native": ["React", "JavaScript"],
    Redux: ["React", "JavaScript"],
    "Vue.js": ["JavaScript"],
    Angular: ["TypeScript", "JavaScript"],
    "Node.js": ["JavaScript"],
    "Express.js": ["Node.js", "JavaScript"],
    NestJS: ["Node.js", "TypeScript", "JavaScript"],
    "Tailwind CSS": ["CSS"],
    Sass: ["CSS"],
    Django: ["Python"],
    Flask: ["Python"],
    FastAPI: ["Python"],
    "Spring Boot": ["Java"],
    PostgreSQL: ["SQL"],
    MySQL: ["SQL"],
    Kubernetes: ["Docker"],
};

// One regex per skill; letters/digits must not touch the match on either side,
// so "java" does not match "javascript" and "go" does not match "google".
const PATTERNS = Object.entries(SKILLS).map(([name, aliases]) => [
    name,
    new RegExp(`(?<![a-z0-9+#.])(?:${aliases.join("|")})(?![a-z0-9+#])`, "i"),
]);

// Words that are too ambiguous in plain English unless they look like tech.
const AMBIGUOUS = new Set(["Go", "Rust", "Swift", "Spring Boot", "Apache", "Excel", "Security", "R", "C"]);

// Skills mentioned in the text, in the order they first appear.
exports.extractSkills = (text = "") => {
    const found = [];
    for (const [name, re] of PATTERNS) {
        const hit = re.exec(text);
        if (!hit) continue;
        // "Go", "Swift", "Rust"... count only when written with a capital (as a name)
        if (AMBIGUOUS.has(name) && !new RegExp(`(?<![A-Za-z])${name.replace(/[+#.]/g, "\\$&")}(?![a-z])`).test(text)) continue;
        found.push([hit.index, name]);
    }
    return found.sort((a, b) => a[0] - b[0]).map(([, name]) => name);
};

// A resume's skills, plus the ones they imply (React -> JavaScript...).
exports.resumeSkills = (text = "") => {
    const skills = new Set(exports.extractSkills(text));
    for (const skill of [...skills]) (IMPLIES[skill] || []).forEach((s) => skills.add(s));
    return [...skills];
};

// How well a resume covers a job's skills. Returns null when the job lists too
// few known skills to judge.
exports.matchScore = (resumeSkills = [], jobSkills = []) => {
    if (jobSkills.length < 2 || !resumeSkills.length) return null;
    const have = new Set(resumeSkills);
    const matched = jobSkills.filter((s) => have.has(s));
    const missing = jobSkills.filter((s) => !have.has(s));
    // the first skills a job names tend to be the core ones: weight them more
    const weight = (i) => (i < 5 ? 2 : 1);
    const total = jobSkills.reduce((sum, _s, i) => sum + weight(i), 0);
    const got = jobSkills.reduce((sum, s, i) => sum + (have.has(s) ? weight(i) : 0), 0);
    const coverage = (got / total) * 100;
    // a job naming only a few skills is weak evidence: pull its score toward 50%
    const confidence = Math.min(1, jobSkills.length / 6);
    return { score: Math.round(coverage * confidence + 50 * (1 - confidence)), matched, missing };
};

exports.SKILL_NAMES = Object.keys(SKILLS);
