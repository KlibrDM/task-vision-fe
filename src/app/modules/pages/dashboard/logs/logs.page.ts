import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
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
import { IProject } from 'src/app/models/project';
import { Subject, combineLatest, first, takeUntil } from 'rxjs';
import { ProjectService } from 'src/app/services/project.service';
import { LogsControllerComponent } from 'src/app/modules/components/logs-controller/logs-controller.component';
import { LogEntities } from 'src/app/models/log';
import { IItem } from 'src/app/models/item';
import { ISprint } from 'src/app/models/sprint';
import { SprintService } from 'src/app/services/sprint.service';
import { ItemService } from 'src/app/services/item.service';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.page.html',
  styleUrls: ['./logs.page.scss'],
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
export class LogsPage {
  destroyed$: Subject<boolean> = new Subject();

  user?: IUser;
  project?: IProject;
  projectUsers?: IUserPartner[];
  items?: IItem[];
  sprints?: ISprint[];

  forceRefreshLogs = Symbol('');

  filterEntities = Object.values(LogEntities).filter(e =>
    e !== LogEntities.ORGANIZATION
    && e !== LogEntities.USER
  );
  activeEntities = Object.values(LogEntities).filter(e =>
    e !== LogEntities.ITEM
    && e !== LogEntities.ORGANIZATION
    && e !== LogEntities.USER
  );

  constructor(
    private router: Router,
    private authService: AuthService,
    private projectService: ProjectService,
    private itemService: ItemService,
    private sprintService: SprintService,
  ) {
    addIcons({ trashOutline, closeOutline, addCircleOutline });
  }


  ionViewDidLeave() {
    this.destroyed$.next(true);
    this.destroyed$.unsubscribe();
  }

  ionViewWillEnter() {
    this.destroyed$ = new Subject();
    this.forceRefreshLogs = Symbol('');

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
    });
  }

  generateIdList() {
    const idList: {id: string, name: string}[] = [
      ...this.items!.map(e => ({id: e._id, name: e.code + ' - ' + e.name})) ?? [],
      ...this.sprints!.map(e => ({id: e._id, name: e.name})),
      ...this.projectUsers!.map(e => ({id: e._id, name: e.first_name + ' ' + e.last_name})),
    ]
    return idList;
  }

  toggleFilterEntity(entity: LogEntities) {
    if (this.activeEntities.includes(entity)) {
      this.activeEntities = this.activeEntities.filter(e => e !== entity);
    }
    else {
      this.activeEntities = [...this.activeEntities, entity];
    }
  }
}
