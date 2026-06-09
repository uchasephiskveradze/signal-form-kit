import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { createFormSchemaFromJson, JsonFormComponent } from '../../lib';
import type { FormSchema } from '../../lib';
import { type OnboardingForm, onboardingSchema } from '../schemas/onboarding.schema';

@Component({
  selector: 'app-showcase',
  imports: [JsonFormComponent, JsonPipe],
  templateUrl: './showcase.component.html',
  styleUrl: './showcase.component.scss',
})
export class ShowcaseComponent {
  protected readonly source = signal<'typescript' | 'json'>('typescript');
  protected readonly onboardingSchema = onboardingSchema;
  protected readonly jsonSchema = signal<FormSchema<OnboardingForm> | null>(null);
  protected readonly liveValue = signal<OnboardingForm>({
    fullName: '',
    email: '',
    age: 25,
    accountType: 'personal',
    taxId: '',
    bio: '',
  });
  protected readonly formValid = signal(false);
  protected readonly lastSubmitted = signal<OnboardingForm | null>(null);

  protected readonly usageSnippet = `import { defineFormSchema, JsonFormComponent } from './lib';

interface OnboardingForm { fullName: string; email: string; ... }

const schema = defineFormSchema<OnboardingForm>({ fields: [...] });

<sf-json-form
  [schema]="schema"
  (formSubmit)="save($event)"
/>`;

  protected onValueChange(value: OnboardingForm): void {
    this.liveValue.set(value);
    this.formValid.set(this.isModelValid(value));
  }

  protected onSubmit(value: OnboardingForm): void {
    this.lastSubmitted.set(value);
    alert(`Form submitted!\n\n${JSON.stringify(value, null, 2)}`);
  }

  protected async loadJsonSchema(): Promise<void> {
    if (!this.jsonSchema()) {
      const response = await fetch('/schemas/onboarding.json');
      const json = await response.json();
      this.jsonSchema.set(createFormSchemaFromJson<OnboardingForm>(json));
    }
    this.source.set('json');
  }

  private isModelValid(value: OnboardingForm): boolean {
    const schema =
      this.source() === 'typescript' ? this.onboardingSchema : this.jsonSchema() ?? this.onboardingSchema;
    const visibleFields = schema.fields.filter((f) => {
      if (f.hideWhen) {
        const rules = Array.isArray(f.hideWhen) ? f.hideWhen : [f.hideWhen];
        return !rules.some((r) => {
          const v = value[r.field as keyof OnboardingForm];
          if (r.equals !== undefined) return v === r.equals;
          if (r.notEquals !== undefined) return v !== r.notEquals;
          return false;
        });
      }
      return true;
    });

    return visibleFields.every((field) => {
      const v = field.validation;
      if (!v) return true;
      const val = value[field.key];

      if (v.required && (val === '' || val == null)) return false;
      if (v.email && typeof val === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return false;
      if (v.minLength && typeof val === 'string' && val.length < v.minLength) return false;
      if (v.min != null && typeof val === 'number' && val < v.min) return false;
      if (v.max != null && typeof val === 'number' && val > v.max) return false;

      return true;
    });
  }
}
