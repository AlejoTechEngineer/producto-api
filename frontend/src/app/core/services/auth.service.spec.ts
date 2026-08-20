import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('empieza sin sesion iniciada', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('login() con admin/admin inicia sesion y devuelve true', () => {
    const resultado = service.login('admin', 'admin');

    expect(resultado).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('login() con credenciales incorrectas no inicia sesion y devuelve false', () => {
    const resultado = service.login('admin', 'incorrecta');

    expect(resultado).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('logout() cierra la sesion', () => {
    service.login('admin', 'admin');
    service.logout();

    expect(service.isAuthenticated()).toBe(false);
  });
});
