const fs = require('fs');
const path = require('path');

const studyDir = path.join(__dirname, 'study');

// Create directories
const directories = [
    '06_FRONTEND',
    '07_BACKEND',
    '08_DATABASE',
    '09_AI',
    '10_ARCHITECTURE',
    '11_PRODUCT',
    '12_SECURITY',
    '13_DEPLOYMENT',
    '14_DEVOPS',
    '15_TESTING',
    '16_INTERVIEW',
    '17_RESOURCES',
    '18_EXERCISES',
    '19_CODE_WALKTHROUGHS',
    '20_CASE_STUDIES'
];

directories.forEach(dir => {
    const fullPath = path.join(studyDir, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
});

function writeMd(filename, content) {
    fs.writeFileSync(path.join(studyDir, filename), content.trim());
}

// 02_PROJECT_OVERVIEW.md
writeMd('02_PROJECT_OVERVIEW.md', `
# 02: PROJECT OVERVIEW

## What is DIZRUPT?
DIZRUPT is an enterprise-grade Talent Intelligence and Execution Management platform. It maps organizational capabilities, analyzes risk (like employee departure impact), recommends resource reallocations, and simulates strategic business outcomes.

## Core Architecture
- **Frontend**: Next.js App Router, React Server Components (RSC), Tailwind CSS, Framer Motion. Built to resemble a fully functional Desktop OS inside the browser.
- **Backend**: Next.js API Routes, custom Intelligence Engines (Decision, Risk, Simulation).
- **Database**: Supabase (PostgreSQL) with Row-Level Security (RLS) for multi-tenant isolation.

## The Desktop OS Paradigm
Instead of a traditional SaaS dashboard, DIZRUPT uses a "Desktop OS" paradigm. Users have a dock, a taskbar, and applications that open in windows. This allows for complex multitasking and spatial mapping of tasks, reducing cognitive load for power users.
`);

// 03_PRODUCT_VISION.md
writeMd('03_PRODUCT_VISION.md', `
# 03: PRODUCT VISION

## Why DIZRUPT Exists
Traditional HRIS (Human Resource Information Systems) are passive repositories of data. They store who works where and what they are paid. DIZRUPT is an **active intelligence engine**. It doesn't just store data; it computes it.

## The Problem
Enterprises waste millions of dollars because they cannot map strategy to execution. They don't know the exact capabilities of their workforce, the hidden dependencies between teams, or the true impact of key personnel departures.

## The Solution
DIZRUPT ingests this data and builds a **Knowledge Graph** of the organization. It uses AI and deterministic mathematical models (like Monte Carlo simulations) to forecast risks and optimize resource allocation.
`);

// 04_BUSINESS_DOMAIN.md
writeMd('04_BUSINESS_DOMAIN.md', `
# 04: BUSINESS DOMAIN

## Talent Intelligence
Talent Intelligence is the application of data science to workforce planning. It involves:
1. **Capability Mapping**: Identifying the skills and proficiencies of individuals.
2. **Gap Analysis**: Comparing current capabilities against strategic needs.
3. **Capacity Planning**: Ensuring enough man-hours are available for strategic initiatives.

## Execution Management
Connecting the strategy (What we want to do) with the execution (Who is doing it and how).
- **Nodes**: People, Projects, Tasks, Outcomes.
- **Edges**: Assignments, Dependencies, Risks.

Understanding this domain is critical for understanding why the database is structured as a graph.
`);

// 05_INFORMATION_ARCHITECTURE.md
writeMd('05_INFORMATION_ARCHITECTURE.md', `
# 05: INFORMATION ARCHITECTURE

## The Core Trinity
1. **People (Talent)**: The nodes that possess capabilities and capacity.
2. **Projects (Execution)**: The nodes that require capabilities and capacity.
3. **Capabilities (Skills)**: The edges that connect People to Projects.

## Data Flow
1. **Ingestion**: Data enters via CSV import (\`src/lib/import/csv.ts\`) or direct API integration.
2. **Transformation**: The Intelligence Engines (\`src/server/engine/*\`) process this data, calculating risk scores, capability matches, and organizational health.
3. **Storage**: Data is persisted in Supabase with strict RLS policies (\`src/lib/rbac.ts\`).
4. **Presentation**: The Next.js frontend fetches this data (often via Server Components) and streams it to the Desktop OS UI.
`);

// PERSONAL_LEARNING_PATH.md
writeMd('PERSONAL_LEARNING_PATH.md', `
# PERSONAL LEARNING PATH

Tailor your learning journey based on your current role and destination.

## Path to Feature Owner (4 Weeks)
1. **Week 1**: Master the Desktop OS UI components (\`src/components/desktop/*\`).
2. **Week 2**: Understand the global state management and window lifecycle.
3. **Week 3**: Build a simple application (e.g., a Notes app) within the OS framework.
4. **Week 4**: Integrate the app with a simple Supabase table and RLS policy.

## Path to Chief Architect (3 Months)
1. **Month 1**: Deep dive into the Engine Room (\`src/server/engine/*\`). Rebuild the Monte Carlo simulation from scratch.
2. **Month 2**: Master the Database and Security. Audit all RLS policies and optimize PostgreSQL indexes.
3. **Month 3**: Cross-system performance. Profile the entire application, identify rendering bottlenecks, and optimize the React component tree.
`);

// FUTURE_ROADMAP.md
writeMd('FUTURE_ROADMAP.md', `
# FUTURE ROADMAP for DIZRUPT

## Immediate Improvements (Technical Debt)
- **Impact: High, Difficulty: Medium**: Refactor \`auth-gate.tsx\` to completely eliminate race conditions during hydration.
- **Impact: High, Difficulty: Low**: Migrate all remaining client-side data fetches to Server Components where interactivity is not required.

## Next-Gen Features
- **Enterprise Integrations (Workday, Jira)**: Build robust SCIM and API syncing engines.
- **Advanced AI Agents**: Move Copilot from a reactive chat interface to a proactive agent that acts on behalf of the user (e.g., automatically reassigning tasks based on risk alerts).
- **Real-time Collaboration**: Implement multiplayer cursors and live editing using Supabase Realtime across all OS windows.
`);

// KNOWLEDGE_GRAPH.md
writeMd('KNOWLEDGE_GRAPH.md', `
# KNOWLEDGE GRAPH

This maps the dependencies between concepts. You cannot understand B without understanding A.

\`\`\`mermaid
graph TD
    A[React Server Components] --> B[Desktop OS UI]
    C[PostgreSQL RLS] --> D[RBAC System]
    D --> B
    E[Graph Theory] --> F[Dependency Intelligence]
    G[Probability Theory] --> H[Simulation Engine]
    F --> I[Decision Intelligence]
    H --> I
    I --> B
\`\`\`
`);

console.log("Top level files generated.");
