import { InjectionToken, Provider, Type, inject } from '@angular/core';
import type { LeafFieldNode } from '../types/form-schema';
import { FIELD_TYPE_CATALOG, type FieldTypeMeta } from '../types/form-schema';

/** Context passed to custom field renderer components. */
export interface CustomFieldRendererInputs {
  fieldDef: LeafFieldNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fieldPath: (...args: any[]) => unknown;
  model: object;
  fieldId: string;
}

export interface CustomFieldTypeDefinition {
  type: string;
  label: string;
  category?: FieldTypeMeta['category'] | 'custom';
  description?: string;
  defaultValue?: unknown;
  component: Type<unknown>;
}

export class FieldTypeRegistry {
  private readonly customTypes = new Map<string, CustomFieldTypeDefinition>();

  /** Built-in leaf types handled by LeafFieldComponent. */
  private readonly builtInTypes = new Set<string>(
    FIELD_TYPE_CATALOG.filter((entry) => entry.category !== 'structural').map((entry) => entry.type),
  );

  register(definition: CustomFieldTypeDefinition): this {
    if (this.builtInTypes.has(definition.type)) {
      throw new Error(`Cannot register custom type "${definition.type}": built-in type name.`);
    }
    this.customTypes.set(definition.type, definition);
    return this;
  }

  isBuiltInType(type: string): boolean {
    return type === 'group' || type === 'array' || this.builtInTypes.has(type);
  }

  isCustomType(type: string): boolean {
    return this.customTypes.has(type);
  }

  getCustomRenderer(type: string): Type<unknown> | undefined {
    return this.customTypes.get(type)?.component;
  }

  getCustomDefinition(type: string): CustomFieldTypeDefinition | undefined {
    return this.customTypes.get(type);
  }

  listCustomTypes(): readonly CustomFieldTypeDefinition[] {
    return [...this.customTypes.values()];
  }

  defaultValueFor(type: string): unknown {
    const custom = this.customTypes.get(type);
    if (custom?.defaultValue !== undefined) {
      return custom.defaultValue;
    }
    return undefined;
  }
}

export function createDefaultFieldTypeRegistry(): FieldTypeRegistry {
  return new FieldTypeRegistry();
}

export const FIELD_TYPE_REGISTRY = new InjectionToken<FieldTypeRegistry>('FIELD_TYPE_REGISTRY', {
  factory: () => createDefaultFieldTypeRegistry(),
});

export function provideFieldTypeRegistry(registry?: FieldTypeRegistry): Provider {
  return { provide: FIELD_TYPE_REGISTRY, useValue: registry ?? createDefaultFieldTypeRegistry() };
}

export function injectFieldTypeRegistry(): FieldTypeRegistry {
  return inject(FIELD_TYPE_REGISTRY);
}
