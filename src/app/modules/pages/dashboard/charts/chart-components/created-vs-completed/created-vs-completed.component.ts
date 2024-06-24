import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IUser, IUserPartner } from 'src/app/models/user';
import { IProject } from 'src/app/models/project';
import { IItem, ItemType } from 'src/app/models/item';
import { ISprint } from 'src/app/models/sprint';
import { Chart } from 'chart.js/auto';
import moment from 'moment';
import 'chartjs-adapter-moment';
import { RouterModule } from '@angular/router';
import { ItemEstimateBadgeComponent } from 'src/app/modules/components/item-estimate-badge/item-estimate-badge.component';
import { ItemPropertyIconComponent } from 'src/app/modules/components/item-property-icon/item-property-icon.component';
import zoomPlugin from 'chartjs-plugin-zoom';

Chart.register(zoomPlugin);

@Component({
  selector: 'app-created-vs-completed',
  templateUrl: './created-vs-completed.component.html',
  styleUrls: ['./created-vs-completed.component.scss'],
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
export class CreatedVSCompletedComponent implements OnInit {
  @Input() user?: IUser;
  @Input() project?: IProject;
  @Input() items?: IItem[];
  @Input() projectUsers?: IUserPartner[];
  @Input() epics?: IItem[];
  @Input() sprints?: ISprint[];

  chart?: any;
  itemReport: { type: string, created: number, completed: number }[] = [];
  itemReportTotals: { created: number, completed: number } = { created: 0, completed: 0 };

  startDate = moment().subtract(1, 'month').format('YYYY-MM-DD');
  endDate = moment().format('YYYY-MM-DD');

  itemTypes = Object.values(ItemType);

  constructor(
    private translate: TranslateService,
  ) { }

  ngOnInit() {
    this.initializeChart();
    this.createItemReport();
  }

  onDateChange() {
    if (!this.startDate || !this.endDate) return;
    if (moment(this.startDate).isAfter(this.endDate)) {
      const aux = this.endDate;
      this.endDate = this.startDate;
      this.startDate = aux;
    }

    this.initializeChart();
    this.createItemReport();
  }

  initializeChart() {
    if (this.chart) this.chart.destroy();

    const completedDataset: { x: string, y: number }[] = [];
    const createdDataset: { x: string, y: number }[] = [];
    const chartDays: string[] = [];

    const createdItems = this.items?.filter(item => moment(item.createdAt).isBetween(this.startDate, this.endDate, 'day', '[]'));
    const completedItems = this.items?.filter(item => item.done_date && moment(item.done_date).isBetween(this.startDate, this.endDate, 'day', '[]'));

    const startDate = moment(this.startDate);
    const endDate = moment(this.endDate);
    let currentDate = startDate;
    while (currentDate.isSameOrBefore(endDate, 'day')) {
      chartDays.push(currentDate.format());

      const createdCount = createdItems?.filter(item => moment(item.createdAt).isSame(currentDate, 'day')).length || 0;
      createdDataset.push({ x: currentDate.format(), y: createdCount });

      const completedCount = completedItems?.filter(item => moment(item.done_date).isSame(currentDate, 'day')).length || 0;
      completedDataset.push({ x: currentDate.format(), y: completedCount });

      currentDate = currentDate.add(1, 'days');
    }

    this.chart = new Chart('canvas', {
      type: 'line',
      data: {
        labels: chartDays,
        datasets: [
          {
            label: this.translate.instant('COMPLETED'),
            data: completedDataset,
            borderColor: 'rgba(40, 180, 60, 0.5)',
            backgroundColor: 'rgba(40, 180, 60, 0.3)',
            fill: true,
            tension: 0.3,
          },
          {
            label: this.translate.instant('CREATED'),
            data: createdDataset,
            borderColor: 'rgba(0, 120, 255, 0.5)',
            backgroundColor: 'rgba(0, 120, 255, 0.3)',
            fill: true,
            tension: 0.3,
          }
        ]
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
          },
          y: {
            beginAtZero: true,
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
    const createdItems = this.items?.filter(item => moment(item.createdAt).isBetween(this.startDate, this.endDate, 'day', '[]'));
    const completedItems = this.items?.filter(item => item.done_date && moment(item.done_date).isBetween(this.startDate, this.endDate, 'day', '[]'));

    this.itemTypes.forEach(type => {
      const createdCount = createdItems?.filter(item => item.type === type).length || 0;
      const completedCount = completedItems?.filter(item => item.type === type).length || 0;

      this.itemReport.push({ type, created: createdCount, completed: completedCount });
    });

    this.itemReportTotals = {
      created: this.itemReport.reduce((acc, curr) => acc + curr.created, 0),
      completed: this.itemReport.reduce((acc, curr) => acc + curr.completed, 0),
    };
  }
}
