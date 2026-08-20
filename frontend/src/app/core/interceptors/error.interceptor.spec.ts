import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import type { MockInstance } from 'vitest';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let snackBarOpenSpy: MockInstance;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    const snackBar = TestBed.inject(MatSnackBar);
    snackBarOpenSpy = vi.spyOn(snackBar, 'open');
  });

  afterEach(() => httpMock.verify());

  it('muestra el mensaje del backend en un snackbar con estilo de error cuando la peticion falla', () => {
    httpClient.get('/api/productos/999').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/productos/999');
    req.flush(
      { message: 'No se encontro el producto con id: 999' },
      { status: 404, statusText: 'Not Found' }
    );

    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'No se encontro el producto con id: 999',
      'Cerrar',
      { duration: 5000, panelClass: ['app-toast', 'app-toast--error'] }
    );
  });
});
