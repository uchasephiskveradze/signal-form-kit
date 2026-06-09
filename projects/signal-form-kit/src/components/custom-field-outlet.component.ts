import { NgComponentOutlet } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import type { LeafFieldNode } from '../types/form-schema';
import { injectFieldTypeRegistry } from '../registry/field-type-registry';

/** Hosts a consumer-registered custom field component. */
@Component({
  selector: 'sf-custom-field-outlet',
  standalone: true,
  imports: [NgComponentOutlet],
  template: `@if (componentType(); as cmp) {
    <ng-container *ngComponentOutlet="cmp; inputs: componentInputs()" />
  }`,
})
export class CustomFieldOutletComponent {
  fieldDef = input.required<LeafFieldNode>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fieldPath = input.required<(...args: any[]) => unknown>();
  model = input.required<object>();
  fieldId = input.required<string>();

  private readonly registry = injectFieldTypeRegistry();

  protected readonly componentType = computed(() =>
    this.registry.getCustomRenderer(this.fieldDef().type),
  );

  protected readonly componentInputs = computed(() => ({
    fieldDef: this.fieldDef(),
    fieldPath: this.fieldPath(),
    model: this.model(),
    fieldId: this.fieldId(),
  }));
}
