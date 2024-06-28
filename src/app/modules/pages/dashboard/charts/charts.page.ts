import { Component, ViewChild, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BoardNavbarComponent } from 'src/app/modules/components/board-navbar/board-navbar.component';
import { AuthService } from 'src/app/services/auth.service';
import { IUser, IUserPartner } from 'src/app/models/user';
import { GeneralHeaderComponent } from 'src/app/modules/components/general-header/general-header.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IProject } from 'src/app/models/project';
import { Subject, combineLatest, first, takeUntil } from 'rxjs';
import { ProjectService } from 'src/app/services/project.service';
import { IItem, ItemType } from 'src/app/models/item';
import { ISprint } from 'src/app/models/sprint';
import { SprintService } from 'src/app/services/sprint.service';
import { ItemService } from 'src/app/services/item.service';
import { BurndownChartComponent } from './chart-components/burndown-chart/burndown-chart.component';
import { BurnupChartComponent } from './chart-components/burnup-chart/burnup-chart.component';
import { SprintReportComponent } from './chart-components/sprint-report/sprint-report.component';
import { VelocityChartComponent } from './chart-components/velocity-chart/velocity-chart.component';
import { CumulativeFlowComponent } from './chart-components/cumulative-flow/cumulative-flow.component';
import { HourTrackingComponent } from './chart-components/hour-tracking/hour-tracking.component';
import { AverageAgeComponent } from './chart-components/average-age/average-age.component';
import { EpicReportComponent } from './chart-components/epic-report/epic-report.component';
import { CreatedVSCompletedComponent } from './chart-components/created-vs-completed/created-vs-completed.component';
import { ItemTypeReportComponent } from './chart-components/item-type-report/item-type-report.component';
import { ResolutionTimeComponent } from './chart-components/resolution-time/resolution-time.component';
import { BugReportComponent } from './chart-components/bug-report/bug-report.component';

interface IChartListItem {
  code: string;
  translation_code: string;
  description_translation_code: string;
  component: any;
}

const ChartList: IChartListItem[] = [
  {
    code: 'burndown',
    translation_code: 'BURNDOWN_CHART',
    description_translation_code: 'BURNDOWN_CHART_SHORT_DESCRIPTION',
    component: BurndownChartComponent
  },
  {
    code: 'burnup',
    translation_code: 'BURNUP_CHART',
    description_translation_code: 'BURNUP_CHART_SHORT_DESCRIPTION',
    component: BurnupChartComponent
  },
  {
    code: 'sprint_report',
    translation_code: 'SPRINT_REPORT',
    description_translation_code: 'SPRINT_REPORT_SHORT_DESCRIPTION',
    component: SprintReportComponent
  },
  {
    code: 'velocity',
    translation_code: 'VELOCITY_CHART',
    description_translation_code: 'VELOCITY_CHART_SHORT_DESCRIPTION',
    component: VelocityChartComponent
  },
  {
    code: 'cumulative_flow',
    translation_code: 'CUMULATIVE_FLOW_DIAGRAM',
    description_translation_code: 'CUMULATIVE_FLOW_DIAGRAM_SHORT_DESCRIPTION',
    component: CumulativeFlowComponent
  },
  {
    code: 'hour_tracking_report',
    translation_code: 'HOUR_TRACKING_REPORT',
    description_translation_code: 'HOUR_TRACKING_REPORT_SHORT_DESCRIPTION',
    component: HourTrackingComponent
  },
  {
    code: 'average_age_report',
    translation_code: 'AVERAGE_AGE_REPORT',
    description_translation_code: 'AVERAGE_AGE_REPORT_SHORT_DESCRIPTION',
    component: AverageAgeComponent
  },
  {
    code: 'epic_report',
    translation_code: 'EPIC_REPORT',
    description_translation_code: 'EPIC_REPORT_SHORT_DESCRIPTION',
    component: EpicReportComponent
  },
  {
    code: 'created_vs_completed',
    translation_code: 'CREATED_VS_COMPLETED',
    description_translation_code: 'CREATED_VS_COMPLETED_SHORT_DESCRIPTION',
    component: CreatedVSCompletedComponent
  },
  {
    code: 'item_type_report',
    translation_code: 'ITEM_TYPE_REPORT',
    description_translation_code: 'ITEM_TYPE_REPORT_SHORT_DESCRIPTION',
    component: ItemTypeReportComponent
  },
  {
    code: 'resolution_time_report',
    translation_code: 'RESOLUTION_TIME_REPORT',
    description_translation_code: 'RESOLUTION_TIME_REPORT_SHORT_DESCRIPTION',
    component: ResolutionTimeComponent
  },
  {
    code: 'bug_report',
    translation_code: 'BUG_REPORT',
    description_translation_code: 'BUG_REPORT_SHORT_DESCRIPTION',
    component: BugReportComponent
  }
];

@Component({
  selector: 'app-charts',
  templateUrl: './charts.page.html',
  styleUrls: ['./charts.page.scss'],
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
export class ChartsPage {
  destroyed$: Subject<boolean> = new Subject();

  chartList = ChartList;
  @ViewChild('chartComponent', {read: ViewContainerRef}) viewRef?: ViewContainerRef;

  user?: IUser;
  project?: IProject;
  items?: IItem[];
  projectUsers?: IUserPartner[];
  epics?: IItem[];
  sprints?: ISprint[];

  selectedChartCode = this.chartList[0].code;
  selectedChartNameTranslationCode = this.chartList[0].translation_code;
  selectedChartComponent = this.chartList[0].component;

  constructor(
    private router: Router,
    private authService: AuthService,
    private projectService: ProjectService,
    private itemService: ItemService,
    private sprintService: SprintService,
  ) { }

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
          .pipe(first())
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
      this.epics = items.filter(e => e.type === ItemType.EPIC && !e.deleted);
      this.projectUsers = users;
      this.sprints = sprints;

      this.createChartComponent(this.selectedChartComponent);
    });
  }

  selectChart(chart: IChartListItem) {
    this.selectedChartCode = chart.code;
    this.selectedChartNameTranslationCode = chart.translation_code;
    this.selectedChartComponent = chart.component;

    this.createChartComponent(chart.component);
  }

  createChartComponent(component: any) {
    this.viewRef?.clear();
    const chartComponent = this.viewRef?.createComponent(component);
    if (chartComponent) {
      (chartComponent.instance as any).user = this.user;
      (chartComponent.instance as any).project = this.project;
      (chartComponent.instance as any).items = this.items;
      (chartComponent.instance as any).epics = this.epics;
      (chartComponent.instance as any).projectUsers = this.projectUsers;
      (chartComponent.instance as any).sprints = this.sprints;
      chartComponent.changeDetectorRef.detectChanges();
    }
  }
}
