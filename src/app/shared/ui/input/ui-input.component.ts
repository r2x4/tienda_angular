import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextId = 0;

@Component({
  selector: 'app-ui-input',
  standalone: true,
  imports: [CommonModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiInputComponent), multi: true }],
  template: `
    <div class="ui-input" [class.ui-input--error]="!!error">
      <label *ngIf="label" class="ui-input__label" [attr.for]="inputId">{{ label }} <span *ngIf="required" aria-hidden="true">*</span></label>
      <input
        class="ui-input__control"
        [id]="inputId"
        [type]="type"
        [attr.placeholder]="placeholder || null"
        [disabled]="disabled"
        [required]="required"
        [attr.aria-invalid]="error ? 'true' : null"
        [attr.aria-describedby]="describedBy"
        [value]="value"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />
      <div *ngIf="hint && !error" class="ui-input__hint" [id]="hintId">{{ hint }}</div>
      <div *ngIf="error" class="ui-input__error" [id]="errorId" role="status">{{ error }}</div>
    </div>
  `,
  styles: [`
    .ui-input{display:flex;flex-direction:column;gap:.375rem;font-family:var(--font-ui)}
    .ui-input__label{font-size:.875rem;font-weight:600;color:var(--color-ink-900)}
    .ui-input__control{width:100%;min-height:44px;padding:.7rem .9rem;border:1px solid var(--color-line-200);border-radius:var(--radius-md);font:inherit;color:var(--color-ink-900);background:#fff;box-sizing:border-box;transition:border-color var(--transition-fast), box-shadow var(--transition-fast)}
    .ui-input__control:focus{outline:none;border-color:var(--color-teal-600);box-shadow:0 0 0 3px rgba(31,122,119,.15)}
    .ui-input__control:disabled{background:#F3F1EC;color:var(--color-ink-600);cursor:not-allowed}
    .ui-input--error .ui-input__control{border-color:var(--color-danger-600)}
    .ui-input__hint{font-size:.8rem;color:var(--color-ink-600)}
    .ui-input__error{font-size:.8rem;color:var(--color-danger-600)}
  `]
})
export class UiInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() type: string = 'text';
  @Input() placeholder = '';
  @Input() required = false;
  @Input() id?: string;
  @Input() disabled = false;
  value = '';
  private uid = ++nextId;
  onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  get inputId(): string { return this.id || `ui-input-${this.uid}`; }
  get hintId(): string { return `${this.inputId}-hint`; }
  get errorId(): string { return `${this.inputId}-error`; }
  get describedBy(): string | null {
    if (this.error) return this.errorId;
    if (this.hint) return this.hintId;
    return null;
  }
  writeValue(value: string | null): void { this.value = value ?? ''; }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }
  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value = val;
    this.onChange(val);
  }
}
