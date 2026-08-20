import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let router: Router;
  let authService: AuthService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService);
  });

  it('permite el acceso si hay sesion iniciada', () => {
    authService.login('admin', 'admin');

    const resultado = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/productos' } as never)
    );

    expect(resultado).toBe(true);
  });

  it('redirige a /login si no hay sesion iniciada', () => {
    const resultado = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/productos' } as never)
    );

    expect(resultado).not.toBe(true);
    expect(router.parseUrl('/login').toString()).toBe(
      (resultado as ReturnType<Router['parseUrl']>).toString()
    );
  });
});
