import { Component, Input } from '@angular/core';
import {FormGroup, Validators, FormsModule, FormBuilder} from '@angular/forms';
import { UsersService } from '../../services/users.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule,CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  loginForm: FormGroup;
  mode: string = 'login';

  constructor(private usersService: UsersService, private router: Router, private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      passwordRepeat: ['', [Validators.required]],
    });

    this.loginForm
      .get('passwordRepeat')
      ?.setValidators([Validators.required, this.passwordMatchValidator]);
  }

  @Input()
  set setmode(value: string) {
    this.mode = value;
    if (value === 'logout') {
      this.usersService.logout();
      this.router.navigate(['userManagement', 'login']);
    }
  }

  email: string = '';
  password: string = '';
  username: string = '';
  fullName: string = '';
  passwordRepeat: string = '';
  error: string = '';

  async login() {
    let logged = await this.usersService.login(this.email, this.password);
    if (logged) {
      await this.router.navigate(['favorites']);
    } else {
      this.error = 'Bad Email or Password';
    }
  }

  async register() {
    const registered = await this.usersService.register(
      this.email,
      this.password,
      this.username,
      this.fullName
    );

    if (registered) {
      await this.router.navigate(['favorites']);
    } else {
      this.error = 'Registration failed';
    }
  }
  passwordMatchValidator() {
    const password = this.loginForm.get('password')?.value;
    const passwordRepeat = this.loginForm.get('passwordRepeat')?.value;

    return password === passwordRepeat ? null : { mismatch: true };
  }
}
