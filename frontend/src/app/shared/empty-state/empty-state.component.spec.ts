import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  it('renderiza el mensaje y el CTA con el label indicado', async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(EmptyStateComponent);
    fixture.componentInstance.mensaje = 'Aun no hay productos por aqui';
    fixture.componentInstance.ctaLabel = 'Crear el primero';
    fixture.componentInstance.ctaLink = '/productos/nuevo';
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-state-message')?.textContent).toContain(
      'Aun no hay productos por aqui'
    );
    expect(compiled.querySelector('button')?.textContent).toContain('Crear el primero');
  });
});
