import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { IUser, IUserPartner } from 'src/app/models/user';
import { IProject } from 'src/app/models/project';
import { IItem } from 'src/app/models/item';
import { ISprint } from 'src/app/models/sprint';
import { Chart } from 'chart.js/auto';
import 'chartjs-adapter-moment';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { RouterModule } from '@angular/router';
import { ItemEstimateBadgeComponent } from 'src/app/modules/components/item-estimate-badge/item-estimate-badge.component';
import { ItemPropertyIconComponent } from 'src/app/modules/components/item-property-icon/item-property-icon.component';
import { ILog, LogAction, LogEntities } from 'src/app/models/log';
import { LogService } from 'src/app/services/log.service';
import zoomPlugin from 'chartjs-plugin-zoom';

Chart.register(zoomPlugin);

@Component({
  selector: 'app-sprint-report',
  templateUrl: './cumulative-flow.component.html',
  styleUrls: ['./cumulative-flow.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    RouterModule,
    ItemEstimateBadgeComponent,
    ItemPropertyIconComponent,
  ]
})
export class CumulativeFlowComponent implements OnInit, OnDestroy {
  destroyed$: Subject<boolean> = new Subject();

  @Input() user?: IUser;
  @Input() project?: IProject;
  @Input() items?: IItem[];
  @Input() projectUsers?: IUserPartner[];
  @Input() epics?: IItem[];
  @Input() sprints?: ISprint[];

  chart?: any;
  isLoading = true;

  logsData: ILog[] = [];

  constructor(
    private logService: LogService,
  ) { }

  ngOnDestroy() {
    if (this.chart) this.chart.destroy();
    this.destroyed$.next(true);
    this.destroyed$.unsubscribe();
  }

  ngOnInit() {
    combineLatest([
      this.logService.getFilteredLogs(
        this.user?.access_token!,
        this.project?._id!,
        [LogEntities.ITEM],
        undefined,
        [LogAction.CREATE]
      ),
      this.logService.getFilteredLogs(
        this.user?.access_token!,
        this.project?._id!,
        [LogEntities.ITEM],
        ['column']
      ),
    ]).pipe(takeUntil(this.destroyed$)).subscribe({
      next: ([createdLogs, columnLogs]) => {
        this.logsData = createdLogs.concat(columnLogs).sort((a, b) => a.createdAt! < b.createdAt! ? -1 : 1);
        this.initializeChart();
      },
      error: () => {
        this.logsData = [];
        this.initializeChart();
      }
    });
  }

  initializeChart() {
    this.isLoading = true;
    if (this.chart) this.chart.destroy();

    const columns = structuredClone(this.project?.board_columns)?.reverse() || [];
    const createdColumn = columns[columns.length - 1];
    const dailyVariation: {
      date: string;
      columns: Map<string, number>;
    }[] = [];
    const chartData: {
      date: string;
      columns: Map<string, number>;
    }[] = [];

    let logsList = structuredClone(this.logsData).filter(log =>
      log.action === LogAction.CREATE
      || (log.changedField === 'column' && log.newValue)
    );

    const startDate = new Date(this.project?.start_date!);
    const endDate = new Date();

    const currentDate = startDate;
    while (currentDate < endDate) {
      dailyVariation.push({
        date: currentDate.toISOString(),
        columns: new Map(
          columns.map(column => [column, 0])
        ),
      });
      const dvIndex = dailyVariation.length - 1;

      const dayLogs = logsList.filter(log => {
        const logDate = new Date(log.createdAt!);
        return logDate.getDate() === currentDate.getDate()
          && Math.abs(logDate.getTime() - currentDate.getTime())<24*60*60*1000
      });
      logsList = logsList.filter(log => !dayLogs.includes(log))

      dayLogs.forEach(log => {
        if (log.action === LogAction.CREATE) {
          dailyVariation[dvIndex].columns.set(createdColumn, dailyVariation[dvIndex].columns.get(createdColumn)! + 1);
        }
        else if (log.changedField === 'column' && log.newValue) {
          dailyVariation[dvIndex].columns.set(log.newValue, dailyVariation[dvIndex].columns.get(log.newValue)! + 1);

          const prevColumnName = log.oldValue;
          if (prevColumnName) {
            dailyVariation[dvIndex].columns.set(prevColumnName, dailyVariation[dvIndex].columns.get(prevColumnName)! - 1);
          }
        }
      });

      chartData.push({
        date: currentDate.toISOString(),
        columns: new Map(
          columns.map(column => [
            column,
            dailyVariation[dvIndex].columns.get(column)! + (chartData[dvIndex - 1]?.columns.get(column) || 0)
          ])
        ),
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    this.chart = new Chart('canvas', {
      type: 'line',
      data: {
        labels: chartData.map(d => d.date),
        datasets: columns.map(column => ({
          label: column,
          data: chartData.map(d => d.columns.get(column)),
          fill: true,
        }))
      },
      options: {
        responsive: true,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              displayFormats: {
                day: 'DD MMM'
              }
            }
          },
          y: {
            beginAtZero: true,
            stacked: true,
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              footer: function(items) {
                return 'Total: ' + items.reduce((a, b) => a + b.parsed.y, 0)
              }
            }
          },
          zoom: {
            pan: {
              enabled: true,
              modifierKey: 'shift',
              mode: 'x',
            },
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true,
              },
              drag: {
                enabled: true,
              },
              mode: 'x',
            }
          }
        }
      },
    });

    this.isLoading = false;
  }
}
