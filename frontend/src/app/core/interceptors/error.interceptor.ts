import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export interface ErrorResponseBody {
  message?: string;
  detalles?: string[];
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const body = error.error as ErrorResponseBody | null;
      const mensaje =
        body?.detalles?.[0] ?? body?.message ?? 'Ocurrio un error inesperado. Intenta de nuevo.';

      snackBar.open(mensaje, 'Cerrar', { duration: 5000, panelClass: ['app-toast', 'app-toast--error'] });

      return throwError(() => error);
    })
  );
};
