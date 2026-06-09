import { ComponentFixture, TestBed } from '@angular/core/testing';
import { defineFormSchema, isGroupField } from '../types/form-schema';
import { provideSignalFormKit } from '../provide-signal-form-kit';
import { findFieldNodeByPath } from '../utils/builder-schema-utils';
import { FormBuilderComponent } from './form-builder.component';

const flush = async (fixture: ComponentFixture<unknown>): Promise<void> => {
  fixture.detectChanges();
  await fixture.whenStable();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  fixture.detectChanges();
};

const paletteButton = (el: HTMLElement, label: string): HTMLButtonElement => {
  const btn = [...el.querySelectorAll('.fb-palette-btn')].find(
    (node) => node.textContent?.trim() === label,
  );
  if (!btn) {
    throw new Error(`Palette button "${label}" not found`);
  }
  return btn as HTMLButtonElement;
};

describe('FormBuilderComponent', () => {
  let fixture: ComponentFixture<FormBuilderComponent>;
  let component: FormBuilderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormBuilderComponent],
      providers: [provideSignalFormKit()],
    }).compileComponents();

    fixture = TestBed.createComponent(FormBuilderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput(
      'initialSchema',
      defineFormSchema({
        title: 'Builder Test',
        description: 'Test form',
        submitLabel: 'Go',
        fields: [],
      }),
    );
    await flush(fixture);
  });

  it('should create and show empty canvas state', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.fb-empty')?.textContent).toContain('No fields yet');
  });

  it('should emit schemaChange on init', async () => {
    const localFixture = TestBed.createComponent(FormBuilderComponent);
    const emitted: unknown[] = [];
    localFixture.componentInstance.schemaChange.subscribe((schema) => emitted.push(schema));
    localFixture.componentRef.setInput(
      'initialSchema',
      defineFormSchema({ title: 'Emitted', fields: [] }),
    );
    await flush(localFixture);

    expect(emitted.length).toBeGreaterThanOrEqual(1);
    expect((emitted[0] as { title?: string }).title).toBe('Emitted');
  });

  it('should add a field from the palette', async () => {
    const el = fixture.nativeElement as HTMLElement;
    paletteButton(el, 'Text').click();
    await flush(fixture);

    expect(el.querySelector('.fb-empty')).toBeNull();
    expect(el.querySelector('sf-json-form')).toBeTruthy();
    expect(el.querySelector('.fb-json')?.textContent).toContain('"type": "text"');
  });

  it('should add nested fields inside a group', async () => {
    const el = fixture.nativeElement as HTMLElement;

    paletteButton(el, 'Group').click();
    await flush(fixture);

    el.querySelector('.fb-add-target-btn')!.dispatchEvent(new Event('click'));
    await flush(fixture);

    paletteButton(el, 'Text').click();
    await flush(fixture);

    const json = el.querySelector('.fb-json')?.textContent ?? '';
    expect(json).toContain('"type": "group"');
    expect(json).toMatch(/"fields":\s*\[[\s\S]*"type":\s*"text"/);
  });

  it('should remove a field from the tree', async () => {
    const el = fixture.nativeElement as HTMLElement;
    paletteButton(el, 'Text').click();
    await flush(fixture);

    el.querySelector('.fb-field-actions .danger')!.dispatchEvent(new Event('click'));
    await flush(fixture);

    expect(el.querySelector('.fb-empty')).toBeTruthy();
    expect(el.querySelector('.fb-json')?.textContent).toContain('"fields": []');
  });

  it('should render live preview with added fields', async () => {
    const el = fixture.nativeElement as HTMLElement;
    paletteButton(el, 'Email').click();
    await flush(fixture);

    expect(el.querySelector('.fb-preview .sf-form')).toBeTruthy();
  });

  it('should resolve nested paths in the field tree', async () => {
    const el = fixture.nativeElement as HTMLElement;
    paletteButton(el, 'Group').click();
    await flush(fixture);

    const groupKeyMatch = el.querySelector('.fb-json')?.textContent?.match(/"key":\s*"([^"]+)"/);
    expect(groupKeyMatch).toBeTruthy();
    const groupKey = groupKeyMatch![1];

    el.querySelector('.fb-add-target-btn')!.dispatchEvent(new Event('click'));
    paletteButton(el, 'Text').click();
    await flush(fixture);

    const schema = JSON.parse(el.querySelector('.fb-json')!.textContent!);
    const group = schema.fields[0];
    expect(isGroupField(group)).toBe(true);
    const childKey = group.fields.at(-1)?.key;
    expect(findFieldNodeByPath(schema.fields, `${groupKey}.${childKey}`)).toBeTruthy();
  });
});
