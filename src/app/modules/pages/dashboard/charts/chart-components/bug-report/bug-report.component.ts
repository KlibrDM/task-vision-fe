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

interface IItemBugReport {
  itemId: string;
  itemCode: string;
  itemName: string;
  isCompleted: boolean;
}

@Component({
  selector: 'app-bug-report',
  templateUrl: './bug-report.component.html',
  styleUrls: ['./bug-report.component.scss'],
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
export class BugReportComponent implements OnInit {
  @Input() user?: IUser;
  @Input() project?: IProject;
  @Input() items?: IItem[];
  @Input() projectUsers?: IUserPartner[];
  @Input() epics?: IItem[];
  @Input() sprints?: ISprint[];

  chart?: any;
  totalItems = 0;
  totalCompletedItems = 0;
  itemReport: IItemBugReport[] = [];

  selectedSprints: ISprint[] = [];

  constructor(
    private translate: TranslateService,
  ) { }

  ngOnInit() {
    this.initializeChart();
  }

  onSelectedSprintsChange() {
    this.initializeChart();
  }

  initializeChart() {
    if (this.chart) this.chart.destroy();

    this.totalItems = 0;
    this.totalCompletedItems = 0;
    this.itemReport = [];

    const createdDataset: { x: string, y: number, dateGroup: string }[] = [];
    const completedDataset: { x: string, y: number, dateGroup: string }[] = [];

    let itemList = this.items?.filter(item => item.type === ItemType.BUG);
    if (this.selectedSprints.length) {
      itemList = itemList?.filter(item => this.selectedSprints.some(sprint =>
        item.sprintId && item.sprintId.length && item.sprintId.includes(sprint._id)
      ));
    }
    itemList?.forEach(item => {
      this.totalItems += 1;
      this.itemReport?.push({
        itemId: item._id,
        itemCode: item.code,
        itemName: item.name,
        isCompleted: !!item.done_date,
      });

      const dataset = createdDataset.find(d => d.dateGroup === moment(item.createdAt).format('YYYY-MM-DD'));
      if (dataset) {
        dataset.y += 1;
      } else {
        createdDataset.push({
          x: moment(item.createdAt).format(),
          y: 1,
          dateGroup: moment(item.createdAt).format('YYYY-MM-DD')
        });
      }

      if (item.done_date) {
        this.totalCompletedItems += 1;
        const dataset = completedDataset.find(d => d.dateGroup === moment(item.done_date).format());
        if (dataset) {
          dataset.y += 1;
        } else {
          completedDataset.push({
            x: moment(item.done_date).format(),
            y: 1,
            dateGroup: moment(item.done_date).format('YYYY-MM-DD')
          });
        }
      }
    });
    this.itemReport.sort((a,b ) => a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? 1 : -1);

    this.chart = new Chart('canvas', {
      type: 'bar',
      data: {
        datasets: [
          {
            label: this.translate.instant('CREATED'),
            data: createdDataset.map(d => ({ x: moment(d.dateGroup).format(), y: d.y })),
            backgroundColor: 'rgba(255, 20, 60, 0.6)',
          },
          {
            label: this.translate.instant('COMPLETED'),
            data: completedDataset.map(d => ({ x: moment(d.dateGroup).format(), y: d.y })),
            backgroundColor: 'rgba(0, 120, 255, 0.6)',
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
}
