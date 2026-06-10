import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { JsonFormComponent } from '@signal-form-kit/core';
import type { ContactForm } from './contact.schema';
import { contactSchema } from './contact.schema';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [JsonFormComponent, JsonPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  protected readonly schema = contactSchema;
  protected readonly submitted = signal<ContactForm | null>(null);

  protected onSubmit(value: ContactForm): void {
    this.submitted.set(value);
  }
}
