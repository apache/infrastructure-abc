import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

import { exec } from 'child_process'
import { promisify } from 'util'

// Get current tag/commit and last commit date from git
const pexec = promisify(exec)
let [commit, version, lastmod] = (
  await Promise.allSettled([
    pexec('git rev-parse --short HEAD'),
    pexec('git describe --tags || git rev-parse --short HEAD'),
    pexec('git log -1 --format=%cd --date=format:"%Y-%m-%d %H:%M"')
  ])
).map((v) => JSON.stringify(v.value?.stdout.trim()))

export default defineConfig({
  plugins: [svelte()],

  define: {
    __COMMIT__: commit,
    __VERSION__: version,
    __LASTMOD__: lastmod
  }
})
