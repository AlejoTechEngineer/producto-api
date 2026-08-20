import { TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let dialogRefSpy: MatDialogRef<ConfirmDialogComponent>;
  const data: ConfirmDialogData = { titulo: 'Eliminar producto', mensaje: '¿Eliminar "Mouse"?' };

  beforeEach(async () => {
    dialogRefSpy = { close: vi.fn() } as unknown as MatDialogRef<ConfirmDialogComponent>;

    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();
  });

  it('cierra el dialog con true al confirmar', () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const botones = compiled.querySelectorAll('button');
    const confirmarBtn = Array.from(botones).find((b) => b.textContent?.includes('Eliminar'));
    confirmarBtn?.dispatchEvent(new Event('click'));

    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });
});
