import { defineConfig } from 'astro/config';
const owner = process.env.GITHUB_REPOSITORY_OWNER || 'jcpopdigitalpartners';
const repository = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'containers-in-practice-course';
const base = process.env.BASE_PATH || (repository === `${owner}.github.io` ? '/' : `/${repository}/`);
export default defineConfig({ output: 'static', site: process.env.SITE_URL || `https://${owner}.github.io`, base });
