import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { JsonFormComponent } from '@signal-form-kit/core';
import type { ContactForm } from './contact.schema';
import { contactSchema } from './contact.schema';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [JsonFormComponent, JsonPipe],
  template: `
    <main class="layout">
      <header class="header">
        <p class="badge">Dogfood example</p>
        <h1>Contact Form</h1>
        <p class="subtitle">
          This app installs <code>@signal-form-kit/core</code> from npm — no monorepo path alias.
        </p>
      </header>

      <section class="panel">
        <sf-json-form [schema]="schema" (formSubmit)="onSubmit($event)" />
      </section>

      @if (submitted(); as payload) {
        <section class="panel result" role="status">
          <h2>Submitted</h2>
          <pre><code>{{ payload | json }}</code></pre>
        </section>
      }
    </main>
  `,
  styleUrl: './app.component.scss',
})
export class AppComponent {
  protected readonly schema = contactSchema;
  protected readonly submitted = signal<ContactForm | null>(null);

  protected onSubmit(value: ContactForm): void {
    this.submitted.set(value);
  }
}
