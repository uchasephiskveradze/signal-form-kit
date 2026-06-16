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

const JSON_SAMPLE_PATH = '/schemas/onboarding.json';

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
  protected readonly jsonSourceText = signal('');
  protected readonly jsonFormKey = signal(0);
  protected readonly jsonLoading = signal(false);
  protected readonly jsonLoadError = signal<string | null>(null);
  protected readonly jsonParseError = signal<string | null>(null);
  protected readonly jsonActionError = signal<string | null>(null);
  protected readonly jsonCopied = signal(false);
  protected readonly jsonSourceLabel = signal('public/schemas/onboarding.json');
  protected readonly jsonAppliedSourceText = signal('');
  protected readonly jsonCanApply = computed(
    () =>
      this.jsonSourceText().trim().length > 0 &&
      this.jsonSourceText().trim() !== this.jsonAppliedSourceText().trim(),
  );
  protected readonly builderSchema = signal<FormSchema>(defineFormSchema({ fields: [] }));
  protected readonly activeSchema = computed<FormSchema<OnboardingForm> | null>(() => {
    const current = this.mode();
    if (current === 'typescript') return this.onboardingSchema;
    if (current === 'json') return this.jsonSchema();
    return this.builderSchema() as FormSchema<OnboardingForm>;
  });
  protected readonly activeFormKey = computed(() =>
    this.mode() === 'json' ? this.jsonFormKey() : 0,
  );
  protected readonly liveValue = signal<OnboardingForm | Record<string, unknown>>({} as OnboardingForm);
  protected readonly formValid = signal(false);
  protected readonly lastSubmitted = signal<OnboardingForm | Record<string, unknown> | null>(null);
  protected readonly submitHighlight = signal(false);

  private readonly submittedPanel = viewChild<ElementRef<HTMLElement>>('submittedPanel');
  private jsonCopyTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly usageSnippet = `import { defineFormSchema, JsonFormComponent, FormBuilderComponent } from '@signal-form-kit/core';

const schema = defineFormSchema<User>({ fields: [...] });

<sf-json-form [schema]="schema" (formSubmit)="save($event)" />
<sf-form-builder (schemaChange)="schema = $event" />`;

  protected readonly jsonUsageSnippet = `import { createFormSchemaFromJson, JsonFormComponent } from '@signal-form-kit/core';

const schema = createFormSchemaFromJson(
  await fetch('/schemas/onboarding.json').then((r) => r.json()),
);

<sf-json-form [schema]="schema" (formSubmit)="save($event)" />`;

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

  protected openJsonMode(): void {
    this.mode.set('json');
    if (!this.jsonSchema() && !this.jsonLoading()) {
      void this.loadJsonSample();
    }
  }

  protected onJsonSourceInput(event: Event): void {
    this.jsonSourceText.set((event.target as HTMLTextAreaElement).value);
    this.jsonParseError.set(null);
    this.jsonActionError.set(null);
    this.jsonSourceLabel.set('Custom schema');
  }

  protected applyJsonSource(): void {
    if (!this.jsonCanApply()) return;

    try {
      const source = this.jsonSourceText().trim();
      const schema = createFormSchemaFromJson<OnboardingForm>(source);
      this.jsonSchema.set(schema);
      this.jsonAppliedSourceText.set(source);
      this.jsonParseError.set(null);
      this.jsonActionError.set(null);
      this.jsonFormKey.update((key) => key + 1);
      this.lastSubmitted.set(null);
    } catch {
      this.jsonParseError.set('Invalid JSON. Check syntax and that fields match the expected schema shape.');
    }
  }

  protected async resetJsonSample(): Promise<void> {
    this.jsonParseError.set(null);
    this.jsonActionError.set(null);
    this.jsonLoadError.set(null);
    await this.loadJsonSample();
  }

  protected async copyJsonSource(): Promise<void> {
    const text = this.jsonSourceText();
    if (!text) return;

    this.jsonActionError.set(null);

    try {
      await navigator.clipboard.writeText(text);
      this.jsonCopied.set(true);
      if (this.jsonCopyTimer) clearTimeout(this.jsonCopyTimer);
      this.jsonCopyTimer = setTimeout(() => this.jsonCopied.set(false), 2000);
    } catch {
      this.jsonActionError.set('Could not copy to clipboard.');
    }
  }

  protected async onJsonFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.jsonActionError.set(null);

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const formatted = JSON.stringify(json, null, 2);
      this.jsonSourceText.set(formatted);
      this.jsonSourceLabel.set(file.name);
      this.jsonParseError.set(null);
      input.value = '';
      this.applyJsonSource();
    } catch {
      this.jsonParseError.set(`Could not read "${file.name}". Upload valid JSON.`);
      input.value = '';
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

  private async loadJsonSample(): Promise<void> {
    this.jsonLoading.set(true);
    this.jsonLoadError.set(null);
    this.jsonParseError.set(null);

    try {
      const response = await fetch(JSON_SAMPLE_PATH);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const text = await response.text();
      const json = JSON.parse(text) as FormSchema<OnboardingForm>;
      const formatted = JSON.stringify(json, null, 2);
      this.jsonSourceText.set(formatted);
      this.jsonAppliedSourceText.set(formatted);
      this.jsonSourceLabel.set('public/schemas/onboarding.json');
      this.jsonSchema.set(createFormSchemaFromJson(json));
      this.jsonFormKey.update((key) => key + 1);
    } catch {
      this.jsonLoadError.set(
        'Could not load onboarding.json. Check that the file exists in public/schemas/.',
      );
    } finally {
      this.jsonLoading.set(false);
    }
  }
}
