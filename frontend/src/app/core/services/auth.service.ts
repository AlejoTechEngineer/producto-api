import { Injectable, signal } from '@angular/core';

const SESSION_KEY = 'producto-api.autenticado';
const USUARIO_VALIDO = 'admin';
const PASSWORD_VALIDA = 'admin';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isAuthenticated = signal(sessionStorage.getItem(SESSION_KEY) === 'true');

  login(usuario: string, password: string): boolean {
    const valido = usuario === USUARIO_VALIDO && password === PASSWORD_VALIDA;

    if (valido) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      this.isAuthenticated.set(true);
    }

    return valido;
  }

  logout(): void {
    sessionStorage.removeItem(SESSION_KEY);
    this.isAuthenticated.set(false);
  }
}
