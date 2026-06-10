import { defineFormSchema } from '@signal-form-kit/core';

export interface ContactForm {
  name: string;
  email: string;
  message: string;
}

export const contactSchema = defineFormSchema<ContactForm>({
  title: 'Contact Us',
  description: 'Minimal consumer app using @signal-form-kit/core from npm.',
  submitLabel: 'Send Message',
  fields: [
    {
      key: 'name',
      label: 'Your Name',
      type: 'text',
      placeholder: 'Jane Doe',
      validation: {
        required: true,
        minLength: 2,
        messages: { required: 'Please enter your name.' },
      },
    },
    {
      key: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'jane@example.com',
      validation: { required: true, email: true },
    },
    {
      key: 'message',
      label: 'Message',
      type: 'textarea',
      placeholder: 'How can we help?',
      validation: {
        required: true,
        minLength: 10,
        messages: { minLength: 'Message must be at least 10 characters.' },
      },
    },
  ],
});
