import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IUser, IUserLoginPayload } from 'src/app/models/user';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslateModule, ReactiveFormsModule]
})
export class LoginPage implements OnInit {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email, Validators.maxLength(120)]),
    password: new FormControl('', [Validators.required, Validators.minLength(5), Validators.maxLength(60)]),
  });

  constructor(
    private auth: AuthService,
    private router: Router,
    private toastController: ToastController,
    private translate: TranslateService,
  ) { }

  ngOnInit() {
    this.auth.currentUser.subscribe((user) => {
      if (user) {
        this.router.navigate([
          user.projects?.length ? '/app/board' : '/app/projects'
        ]);
      }
    });
  }

  loginUser() {
    if (this.loginForm.invalid) {
      return;
    }
    const formValues = this.loginForm.value;
    const user: IUserLoginPayload = {
      email: formValues.email!,
      password: formValues.password!,
    };
    this.auth.loginUser(user).subscribe({
      next: (res) => {
        const user = res as IUser;
        this.auth.setCurrentUser(user);
      },
      error: () => {
        this.toastController.create({
          message: this.translate.instant('INCORRECT_EMAIL_OR_PASSWORD'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      }
    });
  }
}
