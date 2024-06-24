import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { IUser, IUserPartner } from 'src/app/models/user';
import { IProject } from 'src/app/models/project';
import { IItem } from 'src/app/models/item';
import { ISprint } from 'src/app/models/sprint';
import { Chart } from 'chart.js/auto';
import moment from 'moment';
import 'chartjs-adapter-moment';
import { firstValueFrom } from 'rxjs';
import { RouterModule } from '@angular/router';
import { ItemEstimateBadgeComponent } from 'src/app/modules/components/item-estimate-badge/item-estimate-badge.component';
import { ItemPropertyIconComponent } from 'src/app/modules/components/item-property-icon/item-property-icon.component';
import { ILog, LogEntities } from 'src/app/models/log';
import { LogService } from 'src/app/services/log.service';
import zoomPlugin from 'chartjs-plugin-zoom';

Chart.register(zoomPlugin);

interface IItemReport {
  itemId: string;
  itemCode: string;
  itemName: string;
  itemEstimate: number;
  activity: {
    date: string;
    userId: string;
    userName: string;
    hours: number;
  }[];
}

interface IUserReport {
  userId: string;
  userName: string;
  totalHours?: number;
  activity: {
    date: string;
    itemId: string;
    itemCode: string;
    itemName: string;
    hours: number;
  }[];
}

@Component({
  selector: 'app-hour-tracking',
  templateUrl: './hour-tracking.component.html',
  styleUrls: ['./hour-tracking.component.scss'],
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
export class HourTrackingComponent implements OnInit {
  @Input() user?: IUser;
  @Input() project?: IProject;
  @Input() items?: IItem[];
  @Input() projectUsers?: IUserPartner[];
  @Input() epics?: IItem[];
  @Input() sprints?: ISprint[];

  chart?: any;

  startDate = moment().startOf('month').format('YYYY-MM-DD');
  endDate = moment().endOf('month').format('YYYY-MM-DD');

  selectedSegment: 'user' | 'item' = 'user';
  itemReport: IItemReport[] = [];
  userReport: IUserReport[] = [];

  logsData: ILog[] = [];

  constructor(
    private logService: LogService,
  ) { }

  async ngOnInit() {
    this.logsData = await firstValueFrom(this.logService.getFilteredLogs(
      this.user?.access_token!,
      this.project?._id!,
      [LogEntities.ITEM],
      ['hours_left'],
      undefined,
      this.startDate,
      this.endDate,
    )).catch(() => {
      return [];
    });

    this.initializeChart();
    this.createItemReport();
    this.createUserReport();
  }

  async onDateChange() {
    if (!this.startDate || !this.endDate) return;
    if (moment(this.startDate).isAfter(this.endDate)) {
      const aux = this.endDate;
      this.endDate = this.startDate;
      this.startDate = aux;
    }

    this.logsData = await firstValueFrom(this.logService.getFilteredLogs(
      this.user?.access_token!,
      this.project?._id!,
      [LogEntities.ITEM],
      ['hours_left'],
      undefined,
      this.startDate,
      this.endDate,
    )).catch(() => {
      return [];
    });

    this.initializeChart();
    this.createItemReport();
    this.createUserReport();
  }

  initializeChart() {
    if (this.chart) this.chart.destroy();

    const projectUsers = structuredClone(this.projectUsers) || [];
    const chartData: {
      date: string;
      users: Map<string, number>;
    }[] = [];

    const startDate = moment(this.startDate);
    const endDate = moment(this.endDate);
    let currentDate = startDate;
    while (currentDate.isSameOrBefore(endDate, 'day')) {
      chartData.push({
        date: currentDate.format(),
        users: new Map(
          projectUsers.map(user => [user._id, 0])
        ),
      });
      const index = chartData.length - 1;
      const dayLogs = this.logsData.filter(log => moment(log.createdAt).isSame(currentDate, 'day'));
      dayLogs.forEach(log => {
        chartData[index].users.set(
          log.logTriggerId || '',
          chartData[index].users.get(log.logTriggerId || '')!
            + (log.oldValue && log.newValue ? (Number(log.oldValue) - Number(log.newValue)) : 0 ));
      });
      currentDate = currentDate.add(1, 'days');
    }

    this.chart = new Chart('canvas', {
      type: 'bar',
      data: {
        labels: chartData.map(d => d.date),
        datasets: projectUsers.map(user => ({
          label: user.first_name + ' ' + user.last_name,
          data: chartData.map(d => d.users.get(user._id)),
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
            },
            stacked: true,
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
            },
            limits: {
              x: {
                min: 'original',
                max: 'original'
              }
            }
          }
        }
      },
    });
  }

  createItemReport() {
    this.itemReport = [];

    this.items?.forEach(item => {
      this.itemReport?.push({
        itemId: item._id,
        itemCode: item.code,
        itemName: item.name,
        itemEstimate: item.estimate || 0,
        activity: this.logsData
          .filter(log => log.affectedEntityId === item._id && log.newValue && log.oldValue)
          .map(log => {
            const user = this.projectUsers?.find(u => u._id === log.logTriggerId);
            return {
              date: moment(log.createdAt).format(),
              userId: log.logTriggerId || '',
              userName: user?.first_name && user?.last_name ? (user?.first_name + ' ' + user?.last_name) : '',
              hours: Number(log.oldValue) - Number(log.newValue),
            }
          })
      });
    });
    this.itemReport = this.itemReport.filter(item => item.activity.length > 0);
  }

  createUserReport() {
    this.userReport = [];

    this.projectUsers?.forEach(user => {
      this.userReport?.push({
        userId: user._id,
        userName: user.first_name + ' ' + user.last_name,
        activity: this.logsData
          .filter(log => log.logTriggerId === user._id && log.newValue && log.oldValue)
          .map(log => {
            const item = this.items?.find(i => i._id === log.affectedEntityId);
            return {
              date: moment(log.createdAt).format(),
              itemId: log.affectedEntityId,
              itemCode: item?.code || '',
              itemName: item?.name || '',
              hours: Number(log.oldValue) - Number(log.newValue),
            }
          })
      });
    });
    this.userReport = this.userReport.map(user => {
      user.totalHours = user.activity.reduce((acc, curr) => acc + curr.hours, 0);
      return user;
    });
    this.userReport = this.userReport.filter(user => user.activity.length > 0);
  }
}
