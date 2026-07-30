# DizruptOS Knowledge Graph

This graph illustrates the interconnected dependencies across the DizruptOS architecture.

```mermaid
graph TD
    %% Business Layer
    subgraph Business Context
        B1(Workforce Management)
        B2(Capacity Planning)
        B3(Risk Mitigation)
        B4(Talent Intelligence)
    end

    %% Architecture Layer
    subgraph Architecture
        A1(Desktop OS Metaphor)
        A2(Three-Layer RBAC)
        A3(Dual Backend Pattern)
    end

    %% Data Layer
    subgraph Data & State
        D1(Zustand useOps)
        D2(Supabase PostgreSQL)
        D3(Atomic Capacity Deltas)
        D4(Cross-Tab Sync)
    end

    %% Intelligence Layer
    subgraph Intelligence
        I1(Gemini Copilot)
        I2(Simulation Engine)
        I3(Org Health Score)
    end

    %% Testing Layer
    subgraph Quality Assurance
        T1(Playwright E2E)
        T2(Vitest Unit)
        T3(CI/CD Pipeline)
    end

    %% Connections
    B1 --> A1
    B2 --> D3
    B3 --> I3
    B4 --> I1

    A1 --> D1
    A2 --> D1
    A2 --> D2

    D1 --> D4
    D1 --> D3
    D3 --> D2

    D1 --> I2
    I2 --> B2

    D2 --> T1
    A2 --> T1
    T1 --> T3
    T2 --> T3
```

## Concept Dependencies

* **To understand `useOps`**, you must first understand the **Desktop OS Metaphor** and **Three-Layer RBAC**.
* **To understand the Simulation Engine**, you must first master **Zustand `useOps`** and deep-cloning algorithms.
* **To understand Playwright E2E**, you must understand the **Persona System** (RBAC) and how cookies define identity.
* **To modify the API**, you must understand the **Repository Pattern** (Dual Backend) and the **Guarded API wrapper**.
