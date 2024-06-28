import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BoardNavbarComponent } from 'src/app/modules/components/board-navbar/board-navbar.component';
import { AuthService } from 'src/app/services/auth.service';
import { IUser } from 'src/app/models/user';
import { IProject, IProjectPayload } from 'src/app/models/project';
import { ProjectService } from 'src/app/services/project.service';
import { addCircleOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { IonModal } from '@ionic/angular';
import { ProjectsCreateModalComponent } from './projects-create-modal/projects-create-modal.component';
import { Subject, first, takeUntil } from 'rxjs';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.page.html',
  styleUrls: ['./projects.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    BoardNavbarComponent,
    ProjectsCreateModalComponent
  ]
})
export class ProjectsPage {
  destroyed$: Subject<boolean> = new Subject();

  user?: IUser;
  projects?: IProject[];

  isCreateModalOpen = false;
  @ViewChild(IonModal) modal?: IonModal;

  constructor(
    private router: Router,
    private authService: AuthService,
    private projectService: ProjectService
  ) {
    addIcons({ addCircleOutline });
  }

  ionViewDidLeave() {
    this.destroyed$.next(true);
    this.destroyed$.unsubscribe();
  }

  ionViewWillEnter() {
    this.destroyed$ = new Subject();

    this.authService.currentUser
      .pipe(takeUntil(this.destroyed$))
      .pipe(first())
      .subscribe((user) => {
        if (!user) {
          this.router.navigate(['']);
          return;
        }

        this.user = user;
        this.projectService.getProjects(this.user.access_token!)
          .pipe(takeUntil(this.destroyed$))
          .subscribe((projects) => {
            this.projects = projects;
          });
      });
  }

  openCreateModal() {
    this.isCreateModalOpen = true;
  }

  onCreateModalClose() {
    this.isCreateModalOpen = false;
  }

  onCreateModalConfirm(project: IProjectPayload) {
    this.isCreateModalOpen = false;
    this.projectService.createProject(this.user?.access_token || '', project).subscribe((project) => {
      this.goToBoard(project);
    });
  }

  goToBoard(project: IProject) {
    this.projectService.setActiveProjectId(this.user!.access_token!, project._id);
    this.projectService.setCurrentProject(project, this.user?._id!);
    this.router.navigate([`/app/board/`]);
  }

  createCancel() {
    this.modal?.dismiss(null, 'cancel');
  }

  createConfirm() {
    this.modal?.dismiss(null, 'confirm');
  }
}
