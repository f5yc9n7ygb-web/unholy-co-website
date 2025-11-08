#!/usr/bin/env node

// Pre-build script to create open-next.config.ts for CI/CD environments
// This avoids the interactive prompt that occurs when the file is missing

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configContent = `// Auto-generated configuration for OpenNext Cloudflare adapter
// This file is created by scripts/create-opennext-config.mjs to avoid interactive prompts in CI/CD
// For custom configuration, see: https://opennext.js.org/cloudflare/get-started

export default {};
`;

const configPath = join(__dirname, '..', 'open-next.config.ts');

try {
  writeFileSync(configPath, configContent, 'utf8');
  console.log('✅ Created open-next.config.ts');
} catch (error) {
  console.error('❌ Failed to create open-next.config.ts:', error);
  process.exit(1);
}
