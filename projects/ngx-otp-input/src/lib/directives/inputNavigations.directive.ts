import {
  AfterContentInit,
  ContentChildren,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  QueryList,
} from '@angular/core';
import { FormArray } from '@angular/forms';

export type OtpValueChangeEvent = [number, string];

@Directive({
  standalone: true,
  selector: '[ngxInputNavigations]',
})
export class InputNavigationsDirective implements AfterContentInit {
  @Input() otpInputsForm!: FormArray;
  private inputsArray: ElementRef<HTMLInputElement>[] = [];

  @ContentChildren('otpInputElement', { descendants: true })
  inputs!: QueryList<ElementRef<HTMLInputElement>>;

  @Input() regexp!: RegExp;

  @Output() valueChange: EventEmitter<OtpValueChangeEvent> =
    new EventEmitter<OtpValueChangeEvent>();
  @Output() handlePaste: EventEmitter<string[]> = new EventEmitter<string[]>();

  ngAfterContentInit() {
    this.inputsArray = this.inputs.toArray();
  }

  private findInputIndex(target: HTMLElement): number {
    return this.inputsArray.findIndex(
      (input) => input.nativeElement === target,
    );
  }

  private setFocus(index: number): void {
    if (index >= 0 && index < this.inputs.length) {
      this.inputsArray[index].nativeElement.focus();
    }
  }

  @HostListener('keydown.arrowLeft', ['$event'])
  onArrowLeft(event: KeyboardEvent): void {
    const index = this.findInputIndex(event.target as HTMLElement);
    if (index > 0) {
      this.setFocus(index - 1);
    }
  }

  @HostListener('keydown.arrowRight', ['$event'])
  onArrowRight(event: KeyboardEvent): void {
    const index = this.findInputIndex(event.target as HTMLElement);
    if (index < this.inputs.length - 1) {
      this.setFocus(index + 1);
    }
  }

  @HostListener('keydown.backspace', ['$event'])
  onBackspace(event: KeyboardEvent): void {
    const index = this.findInputIndex(event.target as HTMLElement);
    if (index >= 0) {
      this.valueChange.emit([index, '']);
      this.setFocus(index - 1);
      event.preventDefault();
    }
  }

  @HostListener('input', ['$event'])
  onKeyUp(event: InputEvent): void {
    const matchRegex = (event.target as HTMLInputElement).value?.match(
      this.regexp,
    );

    const index = this.findInputIndex(event.target as HTMLElement);
    const previousValue = this.otpInputsForm.controls[index].value;
    const currentValue = (event.target as HTMLInputElement).value;

    // If new value is typed on existing value
    if (currentValue.length === 2 && matchRegex && previousValue) {
      // Only extract the new character
      const value = currentValue.replace(previousValue, '');
      this.valueChange.emit([index, value]);
      this.inputsArray[index].nativeElement.value = value;
      this.setFocus(index + 1);
    }
    // If new value is typed on empty input
    else if (currentValue.length === 1 && matchRegex && !previousValue) {
      this.valueChange.emit([index, currentValue]);
      this.inputsArray[index].nativeElement.value = currentValue;
      this.setFocus(index + 1);
    }
    // Consider paste event
    else if (currentValue.length > 1 && matchRegex && !previousValue) {
      const values = currentValue.split('');
      this.inputsArray.forEach((input, index) => {
        const value = values.at(index);
        if (value) input.nativeElement.value = value;
      });
      this.handlePaste.emit(values);
      this.setFocus(
        values.length >= this.inputsArray.length
          ? this.inputsArray.length - 1
          : values.length,
      );
    }
    // Revert to previous value if regex does not match
    else if (!matchRegex && previousValue) {
      this.valueChange.emit([index, previousValue]);
      this.inputsArray[index].nativeElement.value = previousValue;
    }
    // If does not match and no previous value, clear the input
    else {
      this.valueChange.emit([index, '']);
      this.inputsArray[index].nativeElement.value = '';
    }
  }
}
