import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BoardNavbarComponent } from 'src/app/modules/components/board-navbar/board-navbar.component';
import { AuthService } from 'src/app/services/auth.service';
import { IUser, IUserOrganizationPartner, IUserRegisterPayload } from 'src/app/models/user';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  addCircleOutline,
  trashOutline,
} from 'ionicons/icons';
import { GeneralHeaderComponent } from 'src/app/modules/components/general-header/general-header.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AlertController, ToastController } from '@ionic/angular/standalone';
import { IProject } from 'src/app/models/project';
import { combineLatest } from 'rxjs';
import { ProjectService } from 'src/app/services/project.service';
import { OrganizationService } from 'src/app/services/organization.service';
import { IOrganization, OrganizationRole } from 'src/app/models/organization';
import { LogEntities } from 'src/app/models/log';
import { LogsControllerComponent } from 'src/app/modules/components/logs-controller/logs-controller.component';

@Component({
  selector: 'app-organization',
  templateUrl: './organization.page.html',
  styleUrls: ['./organization.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    BoardNavbarComponent,
    GeneralHeaderComponent,
    MatTooltipModule,
    ReactiveFormsModule,
    LogsControllerComponent,
  ]
})
export class OrganizationPage {
  user?: IUser;
  organization?: IOrganization;
  organizationUsers?: IUserOrganizationPartner[];
  projects?: IProject[];
  currentUserRole?: OrganizationRole;

  createForm = new FormGroup({
    firstName: new FormControl('', [Validators.required, Validators.maxLength(60)]),
    lastName: new FormControl('', [Validators.required, Validators.maxLength(60)]),
    email: new FormControl('', [Validators.required, Validators.email, Validators.maxLength(120)]),
    password: new FormControl('', [Validators.required, Validators.minLength(5), Validators.maxLength(60)]),
  });

  organizationRoles = Object.values(OrganizationRole).filter((role) => role !== OrganizationRole.OWNER);
  organizationRolesEnum = OrganizationRole;
  logEntities = LogEntities;

  constructor(
    private router: Router,
    private authService: AuthService,
    private organizationService: OrganizationService,
    private projectService: ProjectService,
    private translate: TranslateService,
    private toastController: ToastController,
    private alertController: AlertController,
  ) {
    addIcons({ trashOutline, closeOutline, addCircleOutline });
  }

  ionViewWillEnter() {
    this.authService.currentUser.subscribe((user) => {
      if (!user) {
        this.router.navigate(['']);
        return;
      }
      this.user = user;

      this.getData();
    });
  }

  getData() {
    combineLatest([
      this.organizationService.getOrganization(this.user!.access_token!),
      this.projectService.getProjects(this.user!.access_token!),
    ]).subscribe(([organization, projects]) => {
      if (organization) {
        this.organization = organization;
        this.organizationService.getOrganizationUsers(this.user!.access_token!, this.organization!._id)
          .subscribe(users => {
            this.organizationUsers = users;
        });

        this.currentUserRole = this.organization.users.find((user) => user.userId === this.user!._id)?.role;
      }
      if (projects) {
        this.projects = projects;
      }
    });
  }

  onGeneralSave() {
    if (!this.organization?.name) {
      return;
    }

    this.organizationService.updateOrganization(this.user!.access_token!, this.organization!._id, {
      name: this.organization.name,
    }).subscribe({
      next: (organization) => {
        this.organization = organization;

        this.toastController.create({
          message: this.translate.instant('ORGANIZATION_UPDATED_SUCCESSFULLY'),
          duration: 4000,
          color: 'success'
        }).then((toast) => toast.present());
      },
      error: () => {
        this.toastController.create({
          message: this.translate.instant('ERROR_WHILE_UPDATING_ORGANIZATION'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      }
    });
  }

  onCreateUser() {
    if (this.createForm.invalid) {
      return;
    }
    const formValues = this.createForm.value;
    const user: IUserRegisterPayload = {
      first_name: formValues.firstName!,
      last_name: formValues.lastName!,
      email: formValues.email!,
      password: formValues.password!,
    };

    this.organizationService.createOrgUser(this.user!.access_token!, this.organization!._id, user).subscribe({
      next: (organization) => {
        this.organization = organization;

        this.organizationService.getOrganizationUsers(this.user!.access_token!, this.organization!._id)
          .subscribe(users => {
            this.organizationUsers = users;
        });

        this.createForm.reset();
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

  async onDeleteUser(userId: string) {
    const alert = await this.alertController.create({
      header: this.translate.instant('DELETE_USER'),
      message: this.translate.instant('DELETE_USER_CONFIRMATION'),
      buttons: [
        {
          text: this.translate.instant('CANCEL'),
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: this.translate.instant('DELETE'),
          cssClass: 'danger',
          handler: () => this.deleteUser(userId)
        }
      ]
    });
    await alert.present();
  }

  deleteUser(userId: string) {
    this.organizationService.deleteOrgUser(this.user!.access_token!, this.organization!._id, userId).subscribe({
      next: (organization) => {
        this.organization = organization;
        this.organizationService.getOrganizationUsers(this.user!.access_token!, this.organization!._id)
          .subscribe(users => {
            this.organizationUsers = users;
        });
      },
      error: () => {
        this.toastController.create({
          message: this.translate.instant('ERROR_WHILE_DELETING_USER'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      }
    });
  }

  onRoleChange(role: OrganizationRole, userId: string) {
    this.organizationService.updateOrgUserRole(
      this.user!.access_token!,
      this.organization!._id,
      userId,
      role
    ).subscribe({
      next: (organization) => {
        this.organization = organization;
        this.organizationService.getOrganizationUsers(this.user!.access_token!, this.organization!._id)
          .subscribe(users => {
            this.organizationUsers = users;
        });
      },
      error: () => {
        this.toastController.create({
          message: this.translate.instant('ERROR_WHILE_UPDATING_USER_ROLE'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      }
    });
  }

  generateIdList() {
    const idList: {id: string, name: string}[] = this.organizationUsers!.map(e => ({
      id: e._id,
      name: e.first_name + ' ' + e.last_name
    }));
    return idList;
  }
}
