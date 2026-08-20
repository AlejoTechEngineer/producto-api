import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PasosDesarrolloComponent } from './pasos-desarrollo.component';

describe('PasosDesarrolloComponent', () => {
  it('muestra los 4 criterios de la rubrica como grupos de pasos', async () => {
    await TestBed.configureTestingModule({
      imports: [PasosDesarrolloComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(PasosDesarrolloComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Arquitectura de la solucion');
    expect(compiled.textContent).toContain('Implementacion');
    expect(compiled.textContent).toContain('Pruebas');
    expect(compiled.textContent).toContain('Repositorio');
  });
});
