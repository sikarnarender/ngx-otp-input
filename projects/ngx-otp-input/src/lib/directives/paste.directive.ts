import {
  ContentChildren,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  QueryList,
} from '@angular/core';

@Directive({
  standalone: true,
  selector: '[ngxOtpPaste]',
})
export class PasteDirective {
  @ContentChildren('otpInputElement', { descendants: true })
  inputs!: QueryList<ElementRef<HTMLInputElement>>;

  @Input() regexp!: RegExp;

  @Output() handlePaste: EventEmitter<string[]> = new EventEmitter<string[]>();

  private setFocus(index: number): void {
    if (index >= 0 && index < this.inputs.length) {
      this.inputs.get(index)?.nativeElement.focus();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const clipboardData = event.clipboardData?.getData('text');
    if (clipboardData && this.regexp.test(clipboardData)) {
      const values = clipboardData.split('');
      this.inputs.forEach((input, index) => {
        if (values[index]) {
          input.nativeElement.value = values[index];
        }
      });
      this.handlePaste.emit(values);
      this.setFocus(
        values.length >= this.inputs.length
          ? this.inputs.length - 1
          : values.length,
      );
    }
  }
}
