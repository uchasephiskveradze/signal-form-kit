import { JsonPipe } from '@angular/common';
import { Component, computed, input, output, signal, type OnInit } from '@angular/core';
import {
  createDefaultField,
  defineFormSchema,
  FIELD_TYPE_CATALOG,
  type FieldNode,
  type FieldType,
  type FormSchema,
  isArrayField,
  isGroupField,
  isLeafField,
} from '../types/form-schema';
import {
  addFieldToContainer,
  containerLabel,
  findFieldNodeByPath,
  moveFieldAtPath,
  removeFieldAtPath,
  updateFieldAtPath,
} from '../utils/builder-schema-utils';
import { FormBuilderTreeComponent } from './form-builder-tree.component';
import { JsonFormComponent } from './json-form.component';

@Component({
  selector: 'sf-form-builder',
  standalone: true,
  imports: [FormBuilderTreeComponent, JsonFormComponent, JsonPipe],
  templateUrl: './form-builder.component.html',
  styleUrl: './form-builder.component.scss',
})
export class FormBuilderComponent implements OnInit {
  initialSchema = input<FormSchema>({
    title: 'Untitled Form',
    description: 'Build your form visually',
    submitLabel: 'Submit',
    fields: [],
  });

  schemaChange = output<FormSchema>();

  protected readonly inputTypes = FIELD_TYPE_CATALOG.filter((f) => f.category === 'input');
  protected readonly choiceTypes = FIELD_TYPE_CATALOG.filter((f) => f.category === 'choice');
  protected readonly structuralTypes = FIELD_TYPE_CATALOG.filter((f) => f.category === 'structural');

  protected readonly schema = signal<FormSchema>(defineFormSchema({ fields: [] }));
  protected readonly selectedPath = signal<string | null>(null);
  protected readonly addTargetPath = signal('');
  protected readonly previewValue = signal<Record<string, unknown>>({});
  protected readonly previewValid = signal(false);
  protected readonly previewSubmitted = signal<Record<string, unknown> | null>(null);

  protected readonly selectedField = computed(() => {
    const path = this.selectedPath();
    if (!path) return null;
    return findFieldNodeByPath(this.schema().fields, path) ?? null;
  });

  protected readonly addTargetLabel = computed(() =>
    containerLabel(this.schema().fields, this.addTargetPath()),
  );

  protected readonly isLeafField = isLeafField;
  protected readonly isGroupField = isGroupField;
  protected readonly isArrayField = isArrayField;

  ngOnInit(): void {
    const initial = this.initialSchema();
    this.schema.set(defineFormSchema({ ...initial, fields: structuredClone(initial.fields) }));
    this.emitSchema();
  }

  protected addField(type: FieldType): void {
    const field = createDefaultField(type);
    const target = this.addTargetPath();
    this.schema.update((s) => ({
      ...s,
      fields: addFieldToContainer(s.fields, target, field),
    }));
    this.selectedPath.set(target ? `${target}.${field.key}` : field.key);
    this.emitSchema();
  }

  protected selectField(path: string): void {
    this.selectedPath.set(path);
  }

  protected setAddTarget(path: string): void {
    this.addTargetPath.set(path);
  }

  protected removeField(path: string): void {
    this.schema.update((s) => ({
      ...s,
      fields: removeFieldAtPath(s.fields, path),
    }));
    if (this.selectedPath() === path || this.selectedPath()?.startsWith(`${path}.`)) {
      this.selectedPath.set(null);
    }
    if (this.addTargetPath() === path || this.addTargetPath().startsWith(`${path}.`)) {
      this.addTargetPath.set('');
    }
    this.emitSchema();
  }

  protected moveField(event: { path: string; direction: -1 | 1 }): void {
    this.schema.update((s) => ({
      ...s,
      fields: moveFieldAtPath(s.fields, event.path, event.direction),
    }));
    this.emitSchema();
  }

  protected updateFormMeta(key: 'title' | 'description' | 'submitLabel', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.schema.update((s) => ({ ...s, [key]: value }));
    this.emitSchema();
  }

  protected updateSelectedKey(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const path = this.selectedPath();
    if (!path) return;

    const oldKey = path.split('.').pop()!;
    const parentPath = path.slice(0, -(oldKey.length + (path.includes('.') ? 1 : 0)));
    const newPath = parentPath ? `${parentPath}.${value}` : value;

    this.schema.update((s) => ({
      ...s,
      fields: updateFieldAtPath(s.fields, path, { key: value } as Partial<FieldNode>),
    }));
    this.selectedPath.set(newPath);
    this.emitSchema();
  }

  protected updateSelectedLabel(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.updateSelected({ label: value });
  }

  protected updateSelectedPlaceholder(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.updateSelected({ placeholder: value });
  }

  protected updateSelectedSection(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.updateSelected({ section: value || undefined });
  }

  protected updateSelectedLayout(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as 'half' | 'full' | '';
    this.updateSelected({ layout: value === 'half' ? 'half' : undefined });
  }

  protected updateSelectedValidation(key: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const raw = target.type === 'checkbox' ? target.checked : target.value;
    const field = this.selectedField();
    if (!field || !isLeafField(field)) return;

    this.updateSelected({
      validation: {
        ...(field.validation ?? {}),
        [key]:
          raw === '' || raw === false
            ? undefined
            : target.type === 'number'
              ? Number(raw)
              : raw,
      },
    } as Partial<FieldNode>);
  }

  protected exportJson(): void {
    const json = JSON.stringify(this.schema(), null, 2);
    void navigator.clipboard.writeText(json);
  }

  protected onPreviewValue(value: object): void {
    this.previewValue.set(value as Record<string, unknown>);
  }

  protected onPreviewValidity(status: { valid: boolean }): void {
    this.previewValid.set(status.valid);
  }

  protected onPreviewSubmit(value: object): void {
    this.previewSubmitted.set(value as Record<string, unknown>);
  }

  protected clearPreviewSubmit(): void {
    this.previewSubmitted.set(null);
  }

  private emitSchema(): void {
    this.schemaChange.emit(this.schema());
  }

  private updateSelected(patch: Partial<FieldNode>): void {
    const path = this.selectedPath();
    if (!path) return;

    this.schema.update((s) => ({
      ...s,
      fields: updateFieldAtPath(s.fields, path, patch),
    }));
    this.emitSchema();
  }
}
