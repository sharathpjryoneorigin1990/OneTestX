/**
 * Utility functions for JSON path extraction, schema validation, and assertions
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import jsonpath from 'jsonpath';

// Initialize Ajv with formats
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

/**
 * Extract a value from JSON using JSONPath
 * @param obj The JSON object to extract from
 * @param path The JSONPath expression (e.g. '$.store.book[0].title')
 * @returns The extracted value or undefined if not found
 */
export function extractJsonPath(obj: any, path: string): any {
  try {
    const result = jsonpath.query(obj, path);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error('Error extracting JSON path:', error);
    return undefined;
  }
}

/**
 * Validate JSON against a JSON Schema
 * @param data The data to validate
 * @param schema The JSON Schema to validate against
 * @returns Validation result with errors if any
 */
export function validateSchema(data: any, schema: object): { valid: boolean; errors: any[] | null } {
  try {
    const validate = ajv.compile(schema);
    const isValid = validate(data);
    return {
      valid: isValid as boolean, // Cast to boolean to fix TypeScript error
      errors: validate.errors || null
    };
  } catch (error) {
    console.error('Schema validation error:', error);
    return {
      valid: false,
      errors: [{ message: error instanceof Error ? error.message : 'Unknown error' }]
    };
  }
}

/**
 * Check if a value is of a specific type
 * @param value The value to check
 * @param type The expected type
 * @returns Whether the value matches the expected type
 */
export function validateType(value: any, type: string): boolean {
  switch (type.toLowerCase()) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'integer':
      return Number.isInteger(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'null':
      return value === null;
    default:
      return false;
  }
}

/**
 * Check if a response time is within a threshold
 * @param responseTime The response time in milliseconds
 * @param threshold The threshold in milliseconds
 * @returns Whether the response time is within the threshold
 */
export function validateResponseTime(responseTime: number, threshold: number): boolean {
  return responseTime <= threshold;
}

/**
 * Format validation errors into a readable string
 * @param errors The validation errors
 * @returns A formatted error string
 */
export function formatValidationErrors(errors: any[]): string {
  if (!errors || errors.length === 0) {
    return '';
  }
  
  return errors.map(error => {
    const path = error.instancePath || '';
    const message = error.message || 'Unknown error';
    return `${path} ${message}`;
  }).join('\n');
}

/**
 * Create a simple JSON Schema from an example object
 * @param example The example object
 * @returns A JSON Schema that matches the structure of the example
 */
export function createSchemaFromExample(example: any): object {
  if (example === null) {
    return { type: 'null' };
  }
  
  if (Array.isArray(example)) {
    if (example.length === 0) {
      return {
        type: 'array',
        items: {}
      };
    }
    
    // Use the first item as a template for the array items
    return {
      type: 'array',
      items: createSchemaFromExample(example[0])
    };
  }
  
  if (typeof example === 'object') {
    const properties: Record<string, any> = {};
    const required: string[] = [];
    
    for (const [key, value] of Object.entries(example)) {
      properties[key] = createSchemaFromExample(value);
      required.push(key);
    }
    
    return {
      type: 'object',
      properties,
      required
    };
  }
  
  // Handle primitive types
  return { type: typeof example };
}
