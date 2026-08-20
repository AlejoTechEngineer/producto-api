import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly error = signal(false);
  readonly ocultarPassword = signal(true);

  readonly form = this.fb.nonNullable.group({
    usuario: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  ingresar(): void {
    if (this.form.invalid) {
      return;
    }

    this.error.set(false);
    const { usuario, password } = this.form.getRawValue();
    const exito = this.authService.login(usuario, password);

    if (exito) {
      this.router.navigate(['/productos']);
    } else {
      this.error.set(true);
    }
  }
}
