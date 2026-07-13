// Sample graph: a hand-picked slice of the JS/web tech ecosystem, grouped
// into rough clusters (languages, runtimes, frontend, backend, tooling,
// data). Good demo material because it has real cluster structure the
// layout should visually reveal.

export const techEcosystem = {
  nodes: [
    { id: 'JavaScript' }, { id: 'TypeScript' }, { id: 'Python' }, { id: 'Rust' }, { id: 'Go' },
    { id: 'Node.js' }, { id: 'Deno' }, { id: 'Bun' },
    { id: 'React' }, { id: 'Vue' }, { id: 'Svelte' }, { id: 'Angular' }, { id: 'SolidJS' },
    { id: 'Next.js' }, { id: 'Nuxt' }, { id: 'SvelteKit' }, { id: 'Remix' },
    { id: 'Express' }, { id: 'Fastify' }, { id: 'NestJS' }, { id: 'Koa' },
    { id: 'Django' }, { id: 'Flask' }, { id: 'FastAPI' },
    { id: 'Webpack' }, { id: 'Vite' }, { id: 'esbuild' }, { id: 'Rollup' }, { id: 'Turbopack' },
    { id: 'ESLint' }, { id: 'Prettier' }, { id: 'Jest' }, { id: 'Vitest' }, { id: 'Playwright' },
    { id: 'PostgreSQL' }, { id: 'Redis' }, { id: 'MongoDB' }, { id: 'SQLite' },
    { id: 'Prisma' }, { id: 'Drizzle' }, { id: 'TypeORM' },
    { id: 'GraphQL' }, { id: 'REST' }, { id: 'tRPC' },
    { id: 'Docker' }, { id: 'Kubernetes' }, { id: 'Terraform' },
    { id: 'npm' }, { id: 'pnpm' }, { id: 'Yarn' },
  ],
  edges: [
    // languages -> runtimes
    { source: 'JavaScript', target: 'Node.js' },
    { source: 'JavaScript', target: 'Deno' },
    { source: 'JavaScript', target: 'Bun' },
    { source: 'TypeScript', target: 'JavaScript' },
    { source: 'TypeScript', target: 'Deno' },
    { source: 'TypeScript', target: 'Bun' },
    { source: 'Rust', target: 'Deno' },
    { source: 'Go', target: 'Docker' },
    { source: 'Rust', target: 'esbuild' },
    { source: 'Rust', target: 'Turbopack' },

    // frontend frameworks
    { source: 'JavaScript', target: 'React' },
    { source: 'JavaScript', target: 'Vue' },
    { source: 'JavaScript', target: 'Svelte' },
    { source: 'TypeScript', target: 'Angular' },
    { source: 'JavaScript', target: 'SolidJS' },
    { source: 'React', target: 'Next.js' },
    { source: 'Vue', target: 'Nuxt' },
    { source: 'Svelte', target: 'SvelteKit' },
    { source: 'React', target: 'Remix' },
    { source: 'Next.js', target: 'Node.js' },
    { source: 'Remix', target: 'Node.js' },

    // backend frameworks
    { source: 'Node.js', target: 'Express' },
    { source: 'Node.js', target: 'Fastify' },
    { source: 'TypeScript', target: 'NestJS' },
    { source: 'NestJS', target: 'Express' },
    { source: 'Node.js', target: 'Koa' },
    { source: 'Python', target: 'Django' },
    { source: 'Python', target: 'Flask' },
    { source: 'Python', target: 'FastAPI' },

    // build tools / bundlers
    { source: 'JavaScript', target: 'Webpack' },
    { source: 'JavaScript', target: 'Vite' },
    { source: 'JavaScript', target: 'esbuild' },
    { source: 'JavaScript', target: 'Rollup' },
    { source: 'Vite', target: 'esbuild' },
    { source: 'Vite', target: 'Rollup' },
    { source: 'Next.js', target: 'Turbopack' },

    // testing / linting
    { source: 'JavaScript', target: 'ESLint' },
    { source: 'JavaScript', target: 'Prettier' },
    { source: 'JavaScript', target: 'Jest' },
    { source: 'Vite', target: 'Vitest' },
    { source: 'Jest', target: 'Playwright' },
    { source: 'TypeScript', target: 'ESLint' },

    // databases
    { source: 'Node.js', target: 'PostgreSQL' },
    { source: 'Node.js', target: 'Redis' },
    { source: 'Node.js', target: 'MongoDB' },
    { source: 'Python', target: 'PostgreSQL' },
    { source: 'Django', target: 'PostgreSQL' },
    { source: 'SQLite', target: 'PostgreSQL' },

    // ORMs
    { source: 'TypeScript', target: 'Prisma' },
    { source: 'Prisma', target: 'PostgreSQL' },
    { source: 'Prisma', target: 'SQLite' },
    { source: 'TypeScript', target: 'Drizzle' },
    { source: 'Drizzle', target: 'PostgreSQL' },
    { source: 'TypeScript', target: 'TypeORM' },
    { source: 'TypeORM', target: 'MongoDB' },

    // APIs
    { source: 'Express', target: 'REST' },
    { source: 'Node.js', target: 'GraphQL' },
    { source: 'GraphQL', target: 'REST' },
    { source: 'TypeScript', target: 'tRPC' },
    { source: 'tRPC', target: 'Next.js' },
    { source: 'tRPC', target: 'REST' },

    // infra
    { source: 'Docker', target: 'Kubernetes' },
    { source: 'Docker', target: 'Node.js' },
    { source: 'Docker', target: 'PostgreSQL' },
    { source: 'Kubernetes', target: 'Terraform' },

    // package managers
    { source: 'Node.js', target: 'npm' },
    { source: 'npm', target: 'pnpm' },
    { source: 'npm', target: 'Yarn' },
  ],
};
