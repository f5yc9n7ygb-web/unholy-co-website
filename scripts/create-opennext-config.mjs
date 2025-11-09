#!/usr/bin/env node

/**
 * @file Pre-build script for OpenNext.
 *
 * This script creates a default `open-next.config.ts` file in the project root.
 * Its primary purpose is to prevent the interactive prompt that OpenNext shows
 * when this configuration file is missing, which is essential for non-interactive
 * CI/CD environments.
 *
 * The generated configuration is optimized for Cloudflare Pages.
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configContent = `// Auto-generated configuration for OpenNext Cloudflare adapter
// This file is created by scripts/create-opennext-config.mjs to avoid interactive prompts in CI/CD
// For custom configuration, see: https://opennext.js.org/cloudflare/get-started

export default {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
  edgeExternals: ["node:crypto"],
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
};
`;

const configPath = join(__dirname, '..', 'open-next.config.ts');

try {
  writeFileSync(configPath, configContent, 'utf8');
  console.log('✅ Created open-next.config.ts');
} catch (error) {
  console.error('❌ Failed to create open-next.config.ts:', error);
  process.exit(1);
}
