/**
 * Config Loader
 * Loads budget configuration from YAML file and validates with Zod
 * Reference: data-model.md lines 52-101, research.md lines 10-54
 */

import yaml from 'js-yaml';
import fs from 'fs/promises';
import { BudgetConfig, BudgetConfigSchema } from './schemas';

/**
 * Load budget configuration from YAML file
 * @param filePath Path to YAML config file
 * @returns Validated BudgetConfig
 * @throws Error if file not found, YAML is malformed, or validation fails
 */
export async function loadBudgetConfig(filePath: string): Promise<BudgetConfig> {
  try {
    // Read YAML file
    const yamlContent = await fs.readFile(filePath, 'utf8');

    // Parse YAML
    const parsed = yaml.load(yamlContent);

    // Validate with Zod schema
    const validated = validateConfig(parsed);

    return validated;
  } catch (error: any) {
    // Re-throw with context
    if (error.code === 'ENOENT') {
      throw new Error(`Budget config file not found: ${filePath}`);
    }

    if (error.name === 'YAMLException') {
      throw new Error(`Failed to parse YAML: ${error.message}`);
    }

    // Zod validation errors and other errors
    throw error;
  }
}

/**
 * Validate budget configuration against Zod schema
 * @param data Raw config object
 * @returns Validated BudgetConfig
 * @throws ZodError if validation fails
 */
export function validateConfig(data: unknown): BudgetConfig {
  return BudgetConfigSchema.parse(data);
}
