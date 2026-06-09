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
import { JsonFormComponent } from './json-form.component';

@Component({
  selector: 'sf-form-builder',
  standalone: true,
  imports: [JsonFormComponent, JsonPipe],
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
  protected readonly previewValue = signal<Record<string, unknown>>({});
  protected readonly previewValid = signal(false);

  protected readonly selectedField = computed(() => {
    const path = this.selectedPath();
    if (!path) return null;
    return this.findField(this.schema().fields, path);
  });

  protected readonly isLeafField = isLeafField;
  protected readonly isGroupField = isGroupField;
  protected readonly isArrayField = isArrayField;

  ngOnInit(): void {
    const initial = this.initialSchema();
    this.schema.set(defineFormSchema({ ...initial, fields: [...initial.fields] }));
    this.emitSchema();
  }

  protected addField(type: FieldType): void {
    const field = createDefaultField(type);
    this.schema.update((s) => ({
      ...s,
      fields: [...s.fields, field],
    }));
    this.selectedPath.set(field.key);
    this.emitSchema();
  }

  protected selectField(path: string): void {
    this.selectedPath.set(path);
  }

  protected removeField(path: string, event: Event): void {
    event.stopPropagation();
    this.schema.update((s) => ({
      ...s,
      fields: s.fields.filter((f) => f.key !== path),
    }));
    if (this.selectedPath() === path) {
      this.selectedPath.set(null);
    }
    this.emitSchema();
  }

  protected moveField(path: string, direction: -1 | 1, event: Event): void {
    event.stopPropagation();
    const index = this.schema().fields.findIndex((f) => f.key === path);
    if (index < 0) return;

    const target = index + direction;
    if (target < 0 || target >= this.schema().fields.length) return;

    this.schema.update((s) => {
      const fields = [...s.fields];
      [fields[index], fields[target]] = [fields[target], fields[index]];
      return { ...s, fields };
    });
    this.emitSchema();
  }

  protected updateFormMeta(key: 'title' | 'description' | 'submitLabel', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.schema.update((s) => ({ ...s, [key]: value }));
    this.emitSchema();
  }

  protected updateSelectedKey(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.updateSelected({ key: value } as Partial<FieldNode>);
  }

  protected updateSelectedLabel(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.updateSelected({ label: value });
  }

  protected updateSelectedPlaceholder(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.updateSelected({ placeholder: value });
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

  protected fieldSummary(field: FieldNode): string {
    return `${field.label ?? field.key} (${field.type})`;
  }

  protected onPreviewValue(value: object): void {
    this.previewValue.set(value as Record<string, unknown>);
  }

  protected onPreviewValidity(status: { valid: boolean }): void {
    this.previewValid.set(status.valid);
  }

  private emitSchema(): void {
    this.schemaChange.emit(this.schema());
  }

  private updateSelected(patch: Partial<FieldNode>): void {
    const path = this.selectedPath();
    if (!path) return;

    this.schema.update((s) => ({
      ...s,
      fields: s.fields.map((field) =>
        field.key === path ? ({ ...field, ...patch } as FieldNode) : field,
      ),
    }));
    this.emitSchema();
  }

  private findField(fields: readonly FieldNode[], path: string): FieldNode | null {
    return fields.find((f) => f.key === path) ?? null;
  }
}
