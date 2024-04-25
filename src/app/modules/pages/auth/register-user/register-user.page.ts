import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/services/auth.service';
import { IUser, IUserRegisterPayload } from 'src/app/models/user';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-register-user',
  templateUrl: './register-user.page.html',
  styleUrls: ['./register-user.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslateModule, ReactiveFormsModule]
})
export class RegisterUserPage implements OnInit {
  registerForm = new FormGroup({
    firstName: new FormControl('', [Validators.required, Validators.maxLength(60)]),
    lastName: new FormControl('', [Validators.required, Validators.maxLength(60)]),
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

  registerUser() {
    if (this.registerForm.invalid) {
      return;
    }
    const formValues = this.registerForm.value;
    const user: IUserRegisterPayload = {
      first_name: formValues.firstName!,
      last_name: formValues.lastName!,
      email: formValues.email!,
      password: formValues.password!,
    };
    this.auth.registerUser(user).subscribe({
      next: (res) => {
        const user = res as IUser;
        this.auth.setCurrentUser(user);
      },
      error: (err) => {
        if (err.error.code === 'EMAIL_IN_USE') {
          this.toastController.create({
            message: this.translate.instant('EMAIL_IN_USE'),
            duration: 4000,
            color: 'danger'
          }).then((toast) => toast.present());
        }
        else {
          this.toastController.create({
            message: this.translate.instant('ERROR_WHILE_CREATING_ACCOUNT'),
            duration: 4000,
            color: 'danger'
          }).then((toast) => toast.present());
        }
      }
    });
  }
}
