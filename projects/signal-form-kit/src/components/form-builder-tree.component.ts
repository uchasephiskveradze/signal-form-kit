import { Component, forwardRef, input, output } from '@angular/core';
import type { FieldNode } from '../types/form-schema';
import { isArrayField, isGroupField, isLeafField } from '../types/form-schema';
import { joinFieldPath } from '../utils/builder-schema-utils';

@Component({
  selector: 'sf-form-builder-tree',
  standalone: true,
  imports: [forwardRef(() => FormBuilderTreeComponent)],
  templateUrl: './form-builder-tree.component.html',
  styleUrl: './form-builder-tree.component.scss',
})
export class FormBuilderTreeComponent {
  fields = input.required<readonly FieldNode[]>();
  containerPath = input('');
  depth = input(0);
  selectedPath = input<string | null>(null);
  addTargetPath = input('');

  selectField = output<string>();
  setAddTarget = output<string>();
  removeField = output<string>();
  moveField = output<{ path: string; direction: -1 | 1 }>();

  protected readonly isGroupField = isGroupField;
  protected readonly isArrayField = isArrayField;
  protected readonly isLeafField = isLeafField;

  protected fieldPath(key: string): string {
    return joinFieldPath(this.containerPath(), key);
  }

  protected fieldSummary(field: FieldNode): string {
    const prefix = isGroupField(field) ? '▸ ' : isArrayField(field) ? '▸[] ' : '';
    return `${prefix}${field.label ?? field.key} (${field.type})`;
  }

  protected isSelected(path: string): boolean {
    return this.selectedPath() === path;
  }

  protected isAddTarget(path: string): boolean {
    return this.addTargetPath() === path;
  }

  protected nestedFields(field: FieldNode): readonly FieldNode[] {
    if (isGroupField(field)) return field.fields;
    if (isArrayField(field)) return field.itemFields;
    return [];
  }

  protected onSelect(field: FieldNode, event: Event): void {
    event.stopPropagation();
    const path = this.fieldPath(field.key);
    this.selectField.emit(path);
    if (isGroupField(field) || isArrayField(field)) {
      this.setAddTarget.emit(path);
    }
  }

  protected onSetAddTarget(path: string, event: Event): void {
    event.stopPropagation();
    this.setAddTarget.emit(path);
  }

  protected onRemove(path: string, event: Event): void {
    event.stopPropagation();
    this.removeField.emit(path);
  }

  protected onMove(path: string, direction: -1 | 1, event: Event): void {
    event.stopPropagation();
    this.moveField.emit({ path, direction });
  }
}
