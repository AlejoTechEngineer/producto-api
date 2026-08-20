import { TestBed } from '@angular/core/testing';
import { DistribucionPreciosChartComponent } from './distribucion-precios-chart.component';

describe('DistribucionPreciosChartComponent', () => {
  it('muestra la leyenda con las 3 categorias y sus conteos', async () => {
    await TestBed.configureTestingModule({
      imports: [DistribucionPreciosChartComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(DistribucionPreciosChartComponent);
    fixture.componentInstance.bajo = 3;
    fixture.componentInstance.medio = 5;
    fixture.componentInstance.alto = 2;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Bajo');
    expect(compiled.textContent).toContain('Medio');
    expect(compiled.textContent).toContain('Alto');
    expect(compiled.querySelectorAll('.distribucion-leyenda-item').length).toBe(3);
  });

  it('cada segmento ocupa el ancho proporcional al total', async () => {
    await TestBed.configureTestingModule({
      imports: [DistribucionPreciosChartComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(DistribucionPreciosChartComponent);
    fixture.componentInstance.bajo = 5;
    fixture.componentInstance.medio = 5;
    fixture.componentInstance.alto = 0;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const segmentos = compiled.querySelectorAll<HTMLElement>('.distribucion-segmento');

    expect(segmentos[0].style.width).toBe('50%');
    expect(segmentos[1].style.width).toBe('50%');
    expect(segmentos[2].style.width).toBe('0%');
  });
});
