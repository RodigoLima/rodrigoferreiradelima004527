import { Directive, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appCpfMask]',
  standalone: true
})
export class CpfMaskDirective {
  private control = inject(NgControl, { optional: true });

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 11);

    const part1 = digits.slice(0, 3);
    const part2 = digits.slice(3, 6);
    const part3 = digits.slice(6, 9);
    const part4 = digits.slice(9, 11);

    let formatted = part1;
    if (digits.length > 3) formatted = `${part1}.${part2}`;
    if (digits.length > 6) formatted = `${part1}.${part2}.${part3}`;
    if (digits.length > 9) formatted = `${part1}.${part2}.${part3}-${part4}`;

    input.value = formatted;
    this.control?.control?.setValue(formatted, { emitEvent: false });
  }
}
