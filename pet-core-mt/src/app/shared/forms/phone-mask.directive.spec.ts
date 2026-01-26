import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PhoneMaskDirective } from './phone-mask.directive';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, PhoneMaskDirective],
  template: `<input [formControl]="control" appPhoneMask />`
})
class HostComponent {
  control = new FormControl<string>('');
}

describe('PhoneMaskDirective', () => {
  it('deve formatar telefone e atualizar o FormControl', async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent]
    }).compileComponents();

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = '65999990000';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(input.value).toBe('(65) 99999-0000');
    expect(fixture.componentInstance.control.value).toBe('(65) 99999-0000');
  });
});

