import { TestBed } from '@angular/core/testing';
import { TopProductosChartComponent } from './top-productos-chart.component';

describe('TopProductosChartComponent', () => {
  it('renderiza una barra por producto con su nombre y precio', async () => {
    await TestBed.configureTestingModule({
      imports: [TopProductosChartComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(TopProductosChartComponent);
    fixture.componentInstance.productos = [
      { nombre: 'Teclado', precio: 189900 },
      { nombre: 'Mouse', precio: 59900 },
    ];
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const filas = compiled.querySelectorAll('.top-chart-fila');

    expect(filas.length).toBe(2);
    expect(compiled.textContent).toContain('Teclado');
    expect(compiled.textContent).toContain('Mouse');
  });

  it('la barra mas cara ocupa el 100% del ancho', async () => {
    await TestBed.configureTestingModule({
      imports: [TopProductosChartComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(TopProductosChartComponent);
    fixture.componentInstance.productos = [
      { nombre: 'Teclado', precio: 200 },
      { nombre: 'Mouse', precio: 100 },
    ];
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const primeraBarra = compiled.querySelector('.top-chart-barra') as HTMLElement;

    expect(primeraBarra.style.width).toBe('100%');
  });
});
