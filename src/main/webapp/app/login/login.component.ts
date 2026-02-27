import { Component, ViewChild, OnInit, AfterViewInit, ElementRef, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { LoginService } from 'app/login/login.service';
import { AccountService } from 'app/core/auth/account.service';

@Component({
  selector: 'jhi-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LoginComponent implements OnInit, AfterViewInit {
  @ViewChild('username', { static: false })
  username!: ElementRef;

  @ViewChild('passwordField', { static: false })
  passwordField!: ElementRef;

  authenticationError = false;

  loginForm = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    rememberMe: new FormControl(false, { nonNullable: true, validators: [Validators.required] }),
  });

  constructor(private accountService: AccountService, private loginService: LoginService, private router: Router) {}

  ngOnInit(): void {
    // if already authenticated then navigate to home page
    this.accountService.identity().subscribe(() => {
      if (this.accountService.isAuthenticated()) {
        this.router.navigate(['']);
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.syncAutofill();
      this.username?.nativeElement?.focus();
    }, 200);
  }

  /**
   * Force la synchronisation des valeurs DOM (autofill navigateur) dans les FormControls.
   */
  private syncAutofill(): void {
    const usernameEl = this.username?.nativeElement;
    const passwordEl = this.passwordField?.nativeElement;

    if (usernameEl?.value) {
      this.loginForm.get('username')?.setValue(usernameEl.value);
    }
    if (passwordEl?.value) {
      this.loginForm.get('password')?.setValue(passwordEl.value);
    }
  }

  login(): void {
    // Toujours sync les valeurs DOM avant envoi (autofill Chrome, Firefox, etc.)
    this.syncAutofill();

    this.loginService.login(this.loginForm.getRawValue()).subscribe({
      next: () => {
        this.authenticationError = false;
        if (!this.router.getCurrentNavigation()) {
          this.router.navigate(['']);
        }
      },
      error: () => (this.authenticationError = true),
    });
  }
}
