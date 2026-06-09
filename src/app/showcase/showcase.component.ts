import { JsonPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import {
  createDefaultField,
  createFormSchemaFromJson,
  defineFormSchema,
  FormBuilderComponent,
  type FormSchema,
  type FormValidity,
} from '../../lib';
import { type OnboardingForm, onboardingSchema } from '../schemas/onboarding.schema';
import { OnboardingFormComponent } from './onboarding-form.component';

type ShowcaseMode = 'typescript' | 'json' | 'builder';

@Component({
  selector: 'app-showcase',
  standalone: true,
  imports: [OnboardingFormComponent, FormBuilderComponent, JsonPipe],
  templateUrl: './showcase.component.html',
  styleUrl: './showcase.component.scss',
})
export class ShowcaseComponent {
  protected readonly mode = signal<ShowcaseMode>('typescript');
  protected readonly onboardingSchema = onboardingSchema;
  protected readonly jsonSchema = signal<FormSchema<OnboardingForm> | null>(null);
  protected readonly builderSchema = signal<FormSchema>(defineFormSchema({ fields: [] }));
  protected readonly activeSchema = computed<FormSchema<OnboardingForm> | null>(() => {
    const current = this.mode();
    if (current === 'typescript') return this.onboardingSchema;
    if (current === 'json') return this.jsonSchema();
    return this.builderSchema() as FormSchema<OnboardingForm>;
  });
  protected readonly liveValue = signal<OnboardingForm | Record<string, unknown>>({} as OnboardingForm);
  protected readonly formValid = signal(false);
  protected readonly lastSubmitted = signal<OnboardingForm | Record<string, unknown> | null>(null);

  protected readonly usageSnippet = `import { defineFormSchema, JsonFormComponent, FormBuilderComponent } from './lib';

const schema = defineFormSchema<User>({ fields: [...] });

<sf-json-form [schema]="schema" (formSubmit)="save($event)" />
<sf-form-builder (schemaChange)="schema = $event" />`;

  protected onValueChange(value: OnboardingForm): void {
    this.liveValue.set(value);
  }

  protected onValidityChange(status: FormValidity): void {
    this.formValid.set(status.valid);
  }

  protected onSubmit(value: OnboardingForm): void {
    this.lastSubmitted.set(value);
  }

  protected onBuilderSchemaChange(schema: FormSchema): void {
    this.builderSchema.set(schema);
  }

  protected async loadJsonSchema(): Promise<void> {
    if (!this.jsonSchema()) {
      const response = await fetch('/schemas/onboarding.json');
      const json = await response.json();
      this.jsonSchema.set(createFormSchemaFromJson<OnboardingForm>(json));
    }
    this.mode.set('json');
  }

  protected openBuilder(): void {
    if (this.builderSchema().fields.length === 0) {
      this.builderSchema.set(
        defineFormSchema({
          title: 'Custom Form',
          description: 'Built with the visual form builder',
          submitLabel: 'Submit',
          fields: [createDefaultField('text', 'name')],
        }),
      );
    }
    this.mode.set('builder');
  }
}
