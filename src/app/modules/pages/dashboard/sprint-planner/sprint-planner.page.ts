import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BoardNavbarComponent } from 'src/app/modules/components/board-navbar/board-navbar.component';
import { AuthService } from 'src/app/services/auth.service';
import { IUser, IUserPartner } from 'src/app/models/user';
import { ProjectService } from 'src/app/services/project.service';
import { IProject } from 'src/app/models/project';
import { IItem } from 'src/app/models/item';
import { ItemService } from 'src/app/services/item.service';
import { Subject, combineLatest, first, takeUntil } from 'rxjs';
import { ItemCreateModalComponent } from 'src/app/modules/components/item-create-modal/item-create-modal.component';
import { ISprint, ISprintPayload, SprintType } from 'src/app/models/sprint';
import { SprintService } from 'src/app/services/sprint.service';
import { ItemDetailsModalComponent } from 'src/app/modules/components/item-details-modal/item-details-modal.component';
import moment from 'moment';
import { warningOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { ItemListComponent } from 'src/app/modules/components/item-list/item-list.component';
import { ManagementHeaderComponent } from 'src/app/modules/components/management-header/management-header.component';
import { ToastController } from '@ionic/angular/standalone';
import { SprintCreateModalComponent } from './sprint-create-modal/sprint-create-modal.component';

interface SprintView {
  id: string,
  name: string,
  description?: string,
  type: SprintType,
  startDate: Date,
  endDate: Date,
  isCompleted: boolean,
  formattedStartDate: string,
  formattedEndDate: string,
  numberOfDays: number,
  daysArray: {
    formattedDate: string,
    isToday: boolean,
    isWeekend: boolean,
  }[],
  totalItems: number,
  totalComplexity: number,
  totalEstimate: number,
  totalWorkLeft: number,
  items: IItem[],
  formName: string,
  formDescription: string,
  formStartDate: string,
  formEndDate: string,
  formChangesMade: boolean,
}

@Component({
  selector: 'app-sprint-planner',
  templateUrl: './sprint-planner.page.html',
  styleUrls: ['./sprint-planner.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    BoardNavbarComponent,
    ManagementHeaderComponent,
    ItemCreateModalComponent,
    ItemDetailsModalComponent,
    ItemListComponent,
    SprintCreateModalComponent
  ]
})
export class SprintPlannerPage {
  destroyed$: Subject<boolean> = new Subject();

  user?: IUser;
  project?: IProject;
  items?: IItem[];
  projectUsers?: IUserPartner[];
  sprints?: ISprint[];

  isCreateModalOpen = false;
  sprintView: SprintView[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private projectService: ProjectService,
    private sprintService: SprintService,
    private itemService: ItemService,
    private translate: TranslateService,
    private toastController: ToastController
  ) {
    addIcons({ warningOutline });
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
    combineLatest([
      this.itemService.getItems(this.user!.access_token!, projectId),
      this.projectService.getProjectUsers(this.user!.access_token!, projectId),
      this.sprintService.getSprints(this.user!.access_token!, projectId)
    ]).pipe(takeUntil(this.destroyed$)).subscribe(([items, users, sprints]) => {
      this.items = items;
      this.projectUsers = users;
      this.sprints = sprints;
      this.createSprintView();
    });
  }

  createSprintView() {
    this.sprintView = this.sprints!
      .filter((sprint) => !sprint.deleted)
      .sort((a,b) => moment(a.start_date).isBefore(b.start_date) ? -1 : 1)
      .map((sprint) => {
        const items = this.items!.filter((item) => item.sprintId?.includes(sprint._id) && !item.deleted);
        const numberOfDays = moment(sprint.end_date).diff(moment(sprint.start_date), 'days');
        return {
          id: sprint._id,
          name: sprint.name,
          description: sprint.description,
          type: sprint.type,
          startDate: sprint.start_date,
          endDate: sprint.end_date,
          isCompleted: sprint.is_completed || false,
          formattedStartDate: moment(sprint.start_date).format('DD/MM/YYYY'),
          formattedEndDate: moment(sprint.end_date).format('DD/MM/YYYY'),
          numberOfDays: numberOfDays,
          daysArray: Array.from({ length: numberOfDays + 1 }, (_, i) => {
            const day = moment(sprint.start_date).add(i, 'days');
            return {
              formattedDate: day.format('ddd DD/MM/YYYY'),
              isToday: day.isSame(moment(), 'day'),
              isWeekend: day.isoWeekday() > 5
            }
          }),
          totalItems: items.length,
          totalComplexity: items.reduce((acc, item) => acc + (item.complexity || 0), 0),
          totalEstimate: items.reduce((acc, item) => acc + (item.estimate || 0), 0),
          totalWorkLeft: items.reduce((acc, item) => acc + (
            item.hours_left && item.hours_left > 0 ? item.hours_left : 0 ?? 0
          ), 0),
          items,
          formName: sprint.name,
          formDescription: sprint.description || '',
          formStartDate: moment(sprint.start_date).format('YYYY-MM-DD'),
          formEndDate: moment(sprint.end_date).format('YYYY-MM-DD'),
          formChangesMade: false
        };
      });
  }

  onFormChangesMade(sprintId: string) {
    const sprint = this.sprintView.find((sprint) => sprint.id === sprintId);
    if (sprint) {
      sprint.formChangesMade = true;
    }
  }

  onSaveChangesClick(sprintId: string) {
    const sprint = this.sprintView.find((sprint) => sprint.id === sprintId);

    if (!sprint || !sprint.formName || !sprint.formStartDate || !sprint.formEndDate) {
      this.toastController.create({
        message: this.translate.instant('FILL_REQUIRED_FIELDS'),
        duration: 4000,
        color: 'danger'
      }).then((toast) => toast.present());
      return;
    }

    if (moment(sprint.formStartDate).isAfter(sprint.formEndDate)) {
      this.toastController.create({
        message: this.translate.instant('START_BEFORE_END'),
        duration: 4000,
        color: 'danger'
      }).then((toast) => toast.present());
      return;
    }

    this.sprintService.updateSprint(this.user!.access_token!, this.project!._id, sprintId, {
      projectId: this.project!._id,
      name: sprint.formName,
      description: sprint.formDescription,
      type: sprint.type,
      start_date: moment(sprint.formStartDate).toDate(),
      end_date: moment(sprint.formEndDate).toDate()
    }).subscribe({
      next: (sprint) => {
        const sprintIndex = this.sprints!.findIndex((prevSprint) => prevSprint._id === sprint._id);
        if (sprintIndex !== -1) {
          this.sprints![sprintIndex] = sprint;
          this.createSprintView();
        }
      },
      error: () => {
        this.toastController.create({
          message: this.translate.instant('ERROR_WHILE_SAVING_SPRINT'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      }
    });
  }

  onSetActiveClick(sprintId: string) {
    this.sprintService.activateSprint(this.user!.access_token!, this.project!._id, sprintId).subscribe({
      next: (project) => {
        this.project = project;
        this.projectService.setCurrentProject(project, this.user?._id!);
      },
      error: () => {
        this.toastController.create({
          message: this.translate.instant('COULDNT_ACTIVATE_SPRINT'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      }
    });
  }

  onCompleteClick(sprintId: string) {
    this.sprintService.completeSprint(this.user!.access_token!, this.project!._id, sprintId).subscribe({
      next: (project) => {
        this.project = project;
        this.projectService.setCurrentProject(project, this.user?._id!);
      },
      error: () => {
        this.toastController.create({
          message: this.translate.instant('COULDNT_COMPLETE_SPRINT'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      }
    });
  }

  onDeleteClick(sprintId: string) {
    this.sprintService.deleteSprint(this.user!.access_token!, this.project!._id, sprintId).subscribe({
      next: (sprint) => {
        const sprintIndex = this.sprints!.findIndex((prevSprint) => prevSprint._id === sprint._id);
        if (sprintIndex !== -1) {
          this.sprints![sprintIndex] = sprint;
          this.createSprintView();
        }
      },
      error: (err) => {
        if (err.error.code) {
          this.toastController.create({
            message: this.translate.instant('CANNOT_DELETE_ACTIVE_SPRINT'),
            duration: 4000,
            color: 'danger'
          }).then((toast) => toast.present());
          return;
        }

        this.toastController.create({
          message: this.translate.instant('COULDNT_DELETE_SPRINT'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      }
    });
  }

  onCreateSprintClick() {
    this.isCreateModalOpen = true;
  }

  onCreateModalClose() {
    this.isCreateModalOpen = false;
  }

  onCreateModalConfirm(sprint: ISprintPayload) {
    this.isCreateModalOpen = false;
    this.sprintService.createSprint(this.user!.access_token!, sprint).subscribe({
      next: (sprint) => {
        this.sprints!.push(sprint);
        this.createSprintView();
      },
      error: () => {
        this.toastController.create({
          message: this.translate.instant('COULDNT_CREATE_SPRINT'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      }
    });
  }
}
