import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { StatCardComponent } from './stat-card.component';

describe('StatCardComponent', () => {
  let fixture: ComponentFixture<StatCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatCardComponent);
  });

  it('anima hasta el valor final con count-up', fakeAsync(() => {
    const component = fixture.componentInstance;
    component.label = 'Total de productos';
    component.value = 42;
    component.ngOnChanges({ value: new SimpleChange(0, 42, false) });

    tick(1000);

    expect(component.displayValue()).toBe('42');
  }));

  it('aplica un transform con rotate al mover el mouse sobre la card', () => {
    fixture.componentInstance.label = 'Total de productos';
    fixture.componentInstance.value = 10;
    fixture.detectChanges();

    const cardEl: HTMLElement = fixture.nativeElement.querySelector('.stat-card');
    Object.defineProperty(cardEl, 'getBoundingClientRect', {
      value: () => ({
        left: 0,
        top: 0,
        width: 200,
        height: 100,
        right: 200,
        bottom: 100,
        x: 0,
        y: 0,
        toJSON: () => {},
      }),
    });
    const rect = cardEl.getBoundingClientRect();

    cardEl.dispatchEvent(
      new MouseEvent('mousemove', {
        clientX: rect.left + rect.width * 0.75,
        clientY: rect.top + rect.height * 0.25,
      })
    );

    expect(cardEl.style.transform).toContain('rotate');
  });
});
