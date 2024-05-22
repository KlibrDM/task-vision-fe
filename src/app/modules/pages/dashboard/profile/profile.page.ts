import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BoardNavbarComponent } from 'src/app/modules/components/board-navbar/board-navbar.component';
import { AuthService } from 'src/app/services/auth.service';
import { IUser } from 'src/app/models/user';
import { GeneralHeaderComponent } from 'src/app/modules/components/general-header/general-header.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Languages } from 'src/app/models/constants';
import { StorageService } from 'src/app/services/storage.service';
import { ToastController } from '@ionic/angular/standalone';
import { LogsControllerComponent } from 'src/app/modules/components/logs-controller/logs-controller.component';
import { LogEntities } from 'src/app/models/log';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    BoardNavbarComponent,
    GeneralHeaderComponent,
    MatTooltipModule,
    LogsControllerComponent,
  ]
})
export class ProfilePage {
  user?: IUser;

  firstName = '';
  lastName = '';

  language = 'en';
  enableReactivity = false;
  mentionNotifications = false;
  assignmentNotifications = false;
  sprintNotifications = false;
  itemNotifications = false;

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordErrorText = '';

  filterEntities = Object.values(LogEntities);
  activeEntities = Object.values(LogEntities);

  languages = Languages;
  logEntities = LogEntities;

  constructor(
    private router: Router,
    private authService: AuthService,
    private translate: TranslateService,
    private storageService: StorageService,
    private toastController: ToastController,
  ) { }

  ionViewWillEnter() {
    this.authService.currentUser.subscribe((user) => {
      if (!user) {
        this.router.navigate(['']);
        return;
      }
      this.user = user;

      this.firstName = this.user!.first_name;
      this.lastName = this.user!.last_name;
      this.language = this.translate.currentLang;

      this.enableReactivity = this.user!.settings?.enable_reactivity || false;
      this.mentionNotifications = this.user!.settings?.mention_notifications || false;
      this.assignmentNotifications = this.user!.settings?.assignment_notifications || false;
      this.sprintNotifications = this.user!.settings?.sprint_notifications || false;
      this.itemNotifications = this.user!.settings?.item_notifications || false;
    });
  }

  onGeneralSave() {
    if (!this.firstName || !this.lastName) {
      return;
    }

    this.authService.updateUser(this.user!.access_token!, {
      first_name: this.firstName,
      last_name: this.lastName,
    }).subscribe({
      next: (user) => {
        this.authService.setCurrentUser(user);

        this.toastController.create({
          message: this.translate.instant('USER_UPDATED_SUCCESSFULLY'),
          duration: 4000,
          color: 'success'
        }).then((toast) => toast.present());
      },
      error: () => {
        this.toastController.create({
          message: this.translate.instant('ERROR_WHILE_UPDATING_USER'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      }
    });
  }

  onSettingsSave() {
    this.authService.updateUser(this.user!.access_token!, {
      settings: {
        enable_reactivity: this.enableReactivity,
        mention_notifications: this.mentionNotifications,
        assignment_notifications: this.assignmentNotifications,
        sprint_notifications: this.sprintNotifications,
        item_notifications: this.itemNotifications,
      }
    }).subscribe({
      next: (user) => {
        this.authService.setCurrentUser(user);

        this.toastController.create({
          message: this.translate.instant('USER_UPDATED_SUCCESSFULLY'),
          duration: 4000,
          color: 'success'
        }).then((toast) => toast.present());
      },
      error: () => {
        this.toastController.create({
          message: this.translate.instant('ERROR_WHILE_UPDATING_USER'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      }
    });
  }

  onChangePassword() {
    if (
      !this.currentPassword
      || !this.newPassword
      || !this.confirmPassword
    ) {
      this.passwordErrorText = this.translate.instant('ALL_FIELDS_REQUIRED');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.passwordErrorText = this.translate.instant('PASSWORDS_DO_NOT_MATCH');
      return;
    }

    if (
      this.newPassword.length < 5
      || this.confirmPassword.length < 5
      || this.currentPassword.length < 5
    ) {
      this.passwordErrorText = this.translate.instant('PASSWORD_MINIMUM_LENGTH_X', { length: 5 });
      return;
    }

    this.passwordErrorText = '';

    this.authService.changePassword(this.user!.access_token!, {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';

        this.toastController.create({
          message: this.translate.instant('PASSWORD_CHANGED_SUCCESSFULLY'),
          duration: 4000,
          color: 'success'
        }).then((toast) => toast.present());
      },
      error: (err) => {
        if (err.error.code === 'INVALID_CURRENT_PASSWORD') {
          this.toastController.create({
            message: this.translate.instant('INVALID_CURRENT_PASSWORD'),
            duration: 4000,
            color: 'danger'
          }).then((toast) => toast.present());
        }
        else {
          this.toastController.create({
            message: this.translate.instant('ERROR_WHILE_CHANGING_PASSWORD'),
            duration: 4000,
            color: 'danger'
          }).then((toast) => toast.present());
        }
      }
    });
  }

  toggleFilterEntity(entity: LogEntities) {
    if (this.activeEntities.includes(entity)) {
      this.activeEntities = this.activeEntities.filter(e => e !== entity);
    }
    else {
      this.activeEntities = [...this.activeEntities, entity];
    }
  }

  onLogout() {
    this.authService.logout(this.user!.access_token!).subscribe();
  }

  onLanguageChange(event: any) {
    this.storageService.set('language', event);
    this.translate.use(event);
  }
}
