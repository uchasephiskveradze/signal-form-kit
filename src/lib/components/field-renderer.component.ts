import { Component, forwardRef, input, output } from '@angular/core';
import type { ArrayFieldNode, FieldNode, LeafFieldNode } from '../types/form-schema';
import { isArrayField, isGroupField, isLeafField } from '../types/form-schema';
import {
  findFieldByPath,
  getValueAtPath,
  VALIDATION_MESSAGES,
} from '../utils/schema-utils';
import { LeafFieldComponent } from './leaf-field.component';

@Component({
  selector: 'sf-field-renderer',
  standalone: true,
  imports: [LeafFieldComponent, forwardRef(() => FieldRendererComponent)],
  templateUrl: './field-renderer.component.html',
  styleUrl: './field-renderer.component.scss',
})
export class FieldRendererComponent {
  fieldNode = input.required<FieldNode>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fieldTree = input.required<any>();
  path = input.required<string>();
  schemaFields = input.required<readonly FieldNode[]>();
  model = input.required<object>();

  addArrayItem = output<{ field: ArrayFieldNode; path: string }>();
  removeArrayItem = output<{ field: ArrayFieldNode; index: number; path: string }>();

  protected readonly isGroupField = isGroupField;
  protected readonly isArrayField = isArrayField;
  protected readonly isLeafField = isLeafField;

  protected childPath(parentPath: string, key: string): string {
    return parentPath ? `${parentPath}.${key}` : key;
  }

  protected groupModel(field: FieldNode): Record<string, unknown> {
    const value = getValueAtPath(
      this.model() as Record<string, unknown>,
      this.childPath(this.path(), field.key),
    );
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  }

  protected childTree(tree: unknown, key: string): unknown {
    if (tree == null) {
      return undefined;
    }
    if (typeof tree !== 'object' && typeof tree !== 'function') {
      return undefined;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (tree as any)[key];
  }

  protected arrayItemTree(arrayTree: unknown, index: number): unknown {
    if (arrayTree == null) {
      return undefined;
    }
    if (typeof arrayTree !== 'object' && typeof arrayTree !== 'function') {
      return undefined;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (arrayTree as any)[index];
  }

  protected arrayLength(field: ArrayFieldNode): number {
    const value = getValueAtPath(this.model() as Record<string, unknown>, this.childPath(this.path(), field.key));
    return Array.isArray(value) ? value.length : 0;
  }

  protected arrayIndices(field: ArrayFieldNode): number[] {
    return Array.from({ length: this.arrayLength(field) }, (_, i) => i);
  }

  protected arrayItemModel(field: ArrayFieldNode, index: number): Record<string, unknown> {
    const value = getValueAtPath(this.model() as Record<string, unknown>, this.childPath(this.path(), field.key));
    if (!Array.isArray(value)) return {};
    return (value[index] as Record<string, unknown>) ?? {};
  }

  protected isHidden(node: unknown): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (node as any)?.()?.['hidden']?.() ?? false;
  }

  protected isInvalid(node: unknown): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (node as any)?.()?.['invalid']?.() ?? false;
  }

  protected isTouched(node: unknown): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (node as any)?.()?.['touched']?.() ?? false;
  }

  protected fieldErrors(node: unknown, fieldPath: string): { kind: string; message: string }[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errors = (node as any)?.()?.['errors']?.() ?? {};
    const leaf = findFieldByPath(this.schemaFields(), fieldPath);
    const validation = leaf?.validation;
    const result: { kind: string; message: string }[] = [];

    for (const kind of Object.keys(errors)) {
      const custom = validation?.messages?.[kind];
      let message = custom ?? VALIDATION_MESSAGES[kind]?.();

      if (!custom && kind === 'minLength' && validation?.minLength != null) {
        message = VALIDATION_MESSAGES['minLength'](validation.minLength);
      } else if (!custom && kind === 'maxLength' && validation?.maxLength != null) {
        message = VALIDATION_MESSAGES['maxLength'](validation.maxLength);
      } else if (!custom && kind === 'min' && validation?.min != null) {
        message = VALIDATION_MESSAGES['min'](validation.min);
      } else if (!custom && kind === 'max' && validation?.max != null) {
        message = VALIDATION_MESSAGES['max'](validation.max);
      }

      result.push({ kind, message: message ?? 'Invalid value.' });
    }

    return result;
  }

  protected onAddArrayItem(field: ArrayFieldNode): void {
    this.addArrayItem.emit({ field, path: this.childPath(this.path(), field.key) });
  }

  protected onRemoveArrayItem(field: ArrayFieldNode, index: number): void {
    this.removeArrayItem.emit({ field, index, path: this.childPath(this.path(), field.key) });
  }

  protected canRemoveArrayItem(field: ArrayFieldNode): boolean {
    return this.arrayLength(field) > (field.minItems ?? 0);
  }

  protected canAddArrayItem(field: ArrayFieldNode): boolean {
    const max = field.maxItems;
    return max == null || this.arrayLength(field) < max;
  }

  protected fieldId(key: string): string {
    const base = this.path();
    return base ? `${base}.${key}` : key;
  }
}
