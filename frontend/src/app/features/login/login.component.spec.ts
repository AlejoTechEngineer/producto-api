import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';

describe('LoginComponent', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('el formulario es invalido si usuario o password estan vacios', async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.form.invalid).toBe(true);
  });

  it('con admin/admin inicia sesion y navega a /productos', async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockReturnValue(Promise.resolve(true));

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.setValue({ usuario: 'admin', password: 'admin' });
    fixture.componentInstance.ingresar();

    expect(navigateSpy).toHaveBeenCalledWith(['/productos']);
  });

  it('con credenciales incorrectas muestra un error y no navega', async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockReturnValue(Promise.resolve(true));

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.setValue({ usuario: 'admin', password: 'incorrecta' });
    fixture.componentInstance.ingresar();

    expect(navigateSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.error()).toBe(true);
  });
});
