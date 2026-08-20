import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActividadComponent } from './actividad.component';

describe('ActividadComponent', () => {
  it('muestra el titulo de la actividad y la rubrica', async () => {
    await TestBed.configureTestingModule({
      imports: [ActividadComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(ActividadComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Backend con servicios RESTful CRUD');
    expect(compiled.textContent).toContain('Rubrica');
  });
});
