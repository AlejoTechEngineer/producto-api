import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AcercaDeComponent } from './acerca-de.component';

describe('AcercaDeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcercaDeComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('muestra el titulo de la seccion tecnica y de la seccion visual', () => {
    const fixture = TestBed.createComponent(AcercaDeComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Lo que se desarrollo');
    expect(compiled.textContent).toContain('Lo que se muestra');
  });
});
