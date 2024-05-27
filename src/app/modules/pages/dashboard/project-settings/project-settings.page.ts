import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BoardNavbarComponent } from 'src/app/modules/components/board-navbar/board-navbar.component';
import { AuthService } from 'src/app/services/auth.service';
import { IUser } from 'src/app/models/user';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  addCircleOutline,
  flaskOutline,
  checkmarkOutline,
  banOutline,
  removeOutline
} from 'ionicons/icons';
import { GeneralHeaderComponent } from 'src/app/modules/components/general-header/general-header.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToastController } from '@ionic/angular/standalone';
import moment from 'moment';
import { IProject } from 'src/app/models/project';
import { combineLatest } from 'rxjs';
import { ProjectService } from 'src/app/services/project.service';

@Component({
  selector: 'app-project-settings',
  templateUrl: './project-settings.page.html',
  styleUrls: ['./project-settings.page.scss'],
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
export class ProjectSettingsPage {
  user?: IUser;
  project?: IProject;

  name = '';
  code = '';
  description = '';
  startDate = moment().format('YYYY-MM-DD');
  endDate = moment().add(6, 'months').format('YYYY-MM-DD');

  boardColumns: string[] = [];
  qaColumn?: string;
  blockedColumn?: string;
  doneColumn?: string;
  
  useSprints = false;
  sprintLength: number | string = 14;
  customSprintLength = 14;
  forceEpicLink = false;
  autoShowLinkedRequirements = false;
  enableMultiSprintItems = false;
  enableHourTracking = false;
  enableReactivity = false;
  autoMoveToQA = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private projectService: ProjectService,
    private translate: TranslateService,
    private toastController: ToastController,
  ) {
    addIcons({
      closeOutline,
      addCircleOutline,
      flaskOutline,
      checkmarkOutline,
      banOutline,
      removeOutline
    });
  }

  ionViewWillEnter() {
    combineLatest([
      this.authService.currentUser,
      this.projectService.getActiveProjectId()
    ]).subscribe(([user, id]) => {
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

      this.projectService.currentProject.subscribe((project) => {
        if (project) {
          this.project = project;
          this.setFormFields();
        }
        else {
          this.projectService.getProject(this.user!.access_token!, id).subscribe((project) => {
            this.project = project;
            this.projectService.setCurrentProject(project, this.user?._id!);
            this.setFormFields()
          });
        }
      });
    });
  }

  setFormFields() {
    this.name = this.project!.name;
    this.code = this.project!.code;
    this.description = this.project!.description;
    this.startDate = moment(this.project!.start_date).format('YYYY-MM-DD');
    this.endDate = moment(this.project!.end_date).format('YYYY-MM-DD');
    this.boardColumns = this.project!.board_columns;
    this.useSprints = this.project!.settings.use_sprints;
    this.sprintLength = this.project!.settings.sprint_length;
    this.customSprintLength = this.project!.settings.sprint_length;
    this.forceEpicLink = this.project!.settings.force_epic_link;
    this.autoShowLinkedRequirements = this.project!.settings.auto_show_linked_requirements;
    this.enableMultiSprintItems = this.project!.settings.enable_multi_sprint_items;
    this.enableHourTracking = this.project!.settings.enable_hour_tracking;
    this.enableReactivity = this.project!.settings.enable_reactivity;
    this.autoMoveToQA = this.project!.settings.auto_move_to_qa;
    this.qaColumn = this.project!.qa_column;
    this.blockedColumn = this.project!.blocked_column;
    this.doneColumn = this.project!.done_column;
  }

  addColumn() {
    this.boardColumns.push('');
  }

  removeColumn(index: number) {
    if (this.boardColumns.length === 1) {
      this.toastController.create({
        message: this.translate.instant('MUST_HAVE_AT_LEAST_ONE_COLUMN'),
        duration: 4000,
        color: 'danger'
      }).then((toast) => toast.present());
      return;
    }
    this.removeColumnType(index);
    this.boardColumns.splice(index, 1);
  }

  setAsQAColumn(index: number) {
    this.qaColumn = this.boardColumns[index];
  }

  setAsBlockedColumn(index: number) {
    this.blockedColumn = this.boardColumns[index];
  }

  setAsDoneColumn(index: number) {
    this.doneColumn = this.boardColumns[index];
  }

  removeColumnType(index: number) {
    if (this.qaColumn === this.boardColumns[index]) {
      this.qaColumn = undefined;
    }
    if (this.blockedColumn === this.boardColumns[index]) {
      this.blockedColumn = undefined;
    }
    if (this.doneColumn === this.boardColumns[index]) {
      this.doneColumn = undefined;
    }
  }

  onGeneralSave() {
    if (!this.name || !this.code || !this.startDate || !this.endDate) {
      return;
    }

    this.projectService.updateProject(this.user!.access_token!, this.project!._id, {
      name: this.name,
      code: this.code,
      description: this.description,
      start_date: moment(this.startDate).toDate(),
      end_date: moment(this.endDate).toDate(),
      qa_column: this.qaColumn, // Must be provided, otherwise will be unset
      blocked_column: this.blockedColumn,
      done_column: this.doneColumn,
    }).subscribe({
      next: (project) => {
        this.project = project;
        this.projectService.setCurrentProject(project, this.user!._id);

        this.toastController.create({
          message: this.translate.instant('PROJECT_UPDATED_SUCCESSFULLY'),
          duration: 4000,
          color: 'success'
        }).then((toast) => toast.present());
      },
      error: () => {
        this.toastController.create({
          message: this.translate.instant('ERROR_WHILE_UPDATING_PROJECT'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      }
    });
  }

  onColumnsSave() {
    if (this.boardColumns.length === 0) {
      return;
    }

    this.projectService.updateProject(this.user!.access_token!, this.project!._id, {
      board_columns: this.boardColumns,
      qa_column: this.qaColumn,
      blocked_column: this.blockedColumn,
      done_column: this.doneColumn,
    }).subscribe({
      next: (project) => {
        this.project = project;
        this.projectService.setCurrentProject(project, this.user!._id);

        this.toastController.create({
          message: this.translate.instant('PROJECT_UPDATED_SUCCESSFULLY'),
          duration: 4000,
          color: 'success'
        }).then((toast) => toast.present());
      },
      error: () => {
        this.toastController.create({
          message: this.translate.instant('ERROR_WHILE_UPDATING_PROJECT'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      }
    });
  }

  onSettingsSave() {
    this.projectService.updateProject(this.user!.access_token!, this.project!._id, {
      settings: {
        use_sprints: this.useSprints,
        sprint_length: typeof this.sprintLength === 'string'
          ? this.customSprintLength
          : this.sprintLength,
        force_epic_link: this.forceEpicLink,
        auto_show_linked_requirements: this.autoShowLinkedRequirements,
        enable_multi_sprint_items: this.enableMultiSprintItems,
        enable_hour_tracking: this.enableHourTracking,
        enable_reactivity: this.enableReactivity,
        auto_move_to_qa: this.autoMoveToQA,
      },
      qa_column: this.qaColumn, // Must be provided, otherwise will be unset
      blocked_column: this.blockedColumn,
      done_column: this.doneColumn,
    }).subscribe({
      next: (project) => {
        this.project = project;
        this.projectService.setCurrentProject(project, this.user!._id);

        this.toastController.create({
          message: this.translate.instant('PROJECT_UPDATED_SUCCESSFULLY'),
          duration: 4000,
          color: 'success'
        }).then((toast) => toast.present());
      },
      error: () => {
        this.toastController.create({
          message: this.translate.instant('ERROR_WHILE_UPDATING_PROJECT'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      }
    });
  }

  trackByFn(index: any) {
    return index;
  }
}
