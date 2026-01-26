import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CpfMaskDirective } from './cpf-mask.directive';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, CpfMaskDirective],
  template: `<input [formControl]="control" appCpfMask />`
})
class HostComponent {
  control = new FormControl<string>('');
}

describe('CpfMaskDirective', () => {
  it('deve formatar CPF e atualizar o FormControl', async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent]
    }).compileComponents();

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = '12345678901';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(input.value).toBe('123.456.789-01');
    expect(fixture.componentInstance.control.value).toBe('123.456.789-01');
  });
});

