import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BoardNavbarComponent } from 'src/app/modules/components/board-navbar/board-navbar.component';
import { AuthService } from 'src/app/services/auth.service';
import { IUser, IUserPartner } from 'src/app/models/user';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  addCircleOutline,
  trashOutline,
} from 'ionicons/icons';
import { GeneralHeaderComponent } from 'src/app/modules/components/general-header/general-header.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AlertController, ToastController } from '@ionic/angular/standalone';
import { IProject, ProjectRole } from 'src/app/models/project';
import { Subject, combineLatest, first, takeUntil } from 'rxjs';
import { ProjectService } from 'src/app/services/project.service';

@Component({
  selector: 'app-manage-members',
  templateUrl: './manage-members.page.html',
  styleUrls: ['./manage-members.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    BoardNavbarComponent,
    GeneralHeaderComponent,
    MatTooltipModule,
  ]
})
export class ManageMembersPage {
  destroyed$: Subject<boolean> = new Subject();

  user?: IUser;
  project?: IProject;
  projectUsers?: IUserPartner[];
  currentUserRole?: ProjectRole;

  email = '';

  projectRoles = Object.values(ProjectRole).filter((role) => role !== ProjectRole.OWNER);
  projectRolesEnum = ProjectRole;

  constructor(
    private router: Router,
    private authService: AuthService,
    private projectService: ProjectService,
    private translate: TranslateService,
    private toastController: ToastController,
    private alertController: AlertController,
  ) {
    addIcons({ trashOutline, closeOutline, addCircleOutline });
  }

  ionViewDidLeave() {
    this.destroyed$.next(true);
    this.destroyed$.unsubscribe();
  }

  ionViewWillEnter() {
    this.destroyed$ = new Subject();

    combineLatest([
      this.authService.currentUser,
      this.projectService.activeProjectId
    ]).pipe(takeUntil(this.destroyed$))
      .pipe(first())
      .subscribe(([user, id]) => {
        if (!user) {
          this.router.navigate(['']);
          return;
        }
        this.user = user;

        if (!id) {
          this.router.navigate(['app/projects']);
          return;
        }
        this.projectService.setActiveProjectId(this.user!.access_token!, id);

        this.projectService.currentProject
          .pipe(takeUntil(this.destroyed$))
          .subscribe((project) => {
            if (project) {
              this.project = project;
              this.getProjectDetails(project._id);
            }
            else {
              this.projectService.getProject(this.user!.access_token!, id)
                .pipe(takeUntil(this.destroyed$))
                .subscribe((project) => {
                  this.project = project;
                  this.projectService.setCurrentProject(project, this.user?._id!);
                  this.getProjectDetails(project._id);
                });
            }
          });
      });
  }

  getProjectDetails(projectId: string) {
    this.projectService.getProjectUsers(this.user!.access_token!, projectId).subscribe((users) => {
      this.projectUsers = users;
      this.currentUserRole = users.find((user) => user._id === this.user!._id)?.role;
    });
  }

  onAddEmail() {
    if (!this.email) {
      return;
    }

    this.projectService.addUserToProject(this.user!.access_token!, this.project!._id, this.email).subscribe({
      next: (project) => {
        this.email = '';
        this.project = project;
        this.projectService.setCurrentProject(project, this.user!._id);
        this.getProjectDetails(this.project!._id);
      },
      error: (err) => {
        if (err.error.code === 'USER_ALREADY_IN_PROJECT') {
          this.toastController.create({
            message: this.translate.instant('USER_ALREADY_IN_PROJECT'),
            duration: 4000,
            color: 'danger'
          }).then((toast) => toast.present());
        }
        else if (err.error.code === 'USER_NOT_FOUND') {
          this.toastController.create({
            message: this.translate.instant('USER_NOT_FOUND'),
            duration: 4000,
            color: 'danger'
          }).then((toast) => toast.present());
        }
        else {
          this.toastController.create({
            message: this.translate.instant('ERROR_WHILE_ADDING_USER'),
            duration: 4000,
            color: 'danger'
          }).then((toast) => toast.present());
        }
      }
    });
  }

  async onRemoveUser(userId: string) {
    const alert = await this.alertController.create({
      header: this.translate.instant('REMOVE_USER'),
      message: this.translate.instant('REMOVE_USER_CONFIRMATION'),
      buttons: [
        {
          text: this.translate.instant('CANCEL'),
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: this.translate.instant('REMOVE'),
          cssClass: 'danger',
          handler: () => this.removeUser(userId)
        }
      ]
    });
    await alert.present();
  }

  removeUser(userId: string) {
    this.projectService.removeUserFromProject(this.user!.access_token!, this.project!._id, userId).subscribe({
      next: (project) => {
        this.project = project;
        this.projectService.setCurrentProject(project, this.user!._id);
        this.getProjectDetails(this.project!._id);
      },
      error: () => {
        this.toastController.create({
          message: this.translate.instant('ERROR_WHILE_REMOVING_USER'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      }
    });
  }

  onRoleChange(role: ProjectRole, userId: string) {
    this.projectService.updateUserRole(this.user!.access_token!, this.project!._id, userId, role).subscribe({
      next: (project) => {
        this.project = project;
        this.projectService.setCurrentProject(project, this.user!._id);
        this.getProjectDetails(this.project!._id);
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
}
