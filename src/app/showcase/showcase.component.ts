import { JsonPipe } from '@angular/common';
import { Component, computed, ElementRef, signal, viewChild } from '@angular/core';
import {
  createDefaultField,
  createFormSchemaFromJson,
  defineFormSchema,
  FormBuilderComponent,
  type FormSchema,
  type FormValidity,
} from '@signal-form-kit/core';
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
  protected readonly jsonLoading = signal(false);
  protected readonly jsonLoadError = signal<string | null>(null);
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
  protected readonly submitHighlight = signal(false);

  private readonly submittedPanel = viewChild<ElementRef<HTMLElement>>('submittedPanel');

  protected readonly usageSnippet = `import { defineFormSchema, JsonFormComponent, FormBuilderComponent } from '@signal-form-kit/core';

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
    this.submitHighlight.set(true);
    setTimeout(() => this.submitHighlight.set(false), 3200);

    requestAnimationFrame(() => {
      this.submittedPanel()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  protected onBuilderSchemaChange(schema: FormSchema): void {
    this.builderSchema.set(schema);
  }

  protected async loadJsonSchema(): Promise<void> {
    this.mode.set('json');
    if (this.jsonSchema() || this.jsonLoading()) return;

    this.jsonLoading.set(true);
    this.jsonLoadError.set(null);

    try {
      const response = await fetch('/schemas/onboarding.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const json = await response.json();
      this.jsonSchema.set(createFormSchemaFromJson<OnboardingForm>(json));
    } catch {
      this.jsonLoadError.set('Could not load onboarding.json. Check that the file exists in public/schemas/.');
    } finally {
      this.jsonLoading.set(false);
    }
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
