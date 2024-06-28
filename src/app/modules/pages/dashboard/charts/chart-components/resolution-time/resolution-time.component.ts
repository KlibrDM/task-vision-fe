import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IUser, IUserPartner } from 'src/app/models/user';
import { IProject } from 'src/app/models/project';
import { IItem, ItemType, ItemTypeColorMap } from 'src/app/models/item';
import { ISprint } from 'src/app/models/sprint';
import { Chart } from 'chart.js/auto';
import moment from 'moment';
import 'chartjs-adapter-moment';
import { RouterModule } from '@angular/router';
import { ItemEstimateBadgeComponent } from 'src/app/modules/components/item-estimate-badge/item-estimate-badge.component';
import { ItemPropertyIconComponent } from 'src/app/modules/components/item-property-icon/item-property-icon.component';

interface IItemResolutionTimeReport {
  itemId: string;
  itemCode: string;
  itemName: string;
  itemType: ItemType;
  itemDoneTime: number;
}

@Component({
  selector: 'app-resolution-time',
  templateUrl: './resolution-time.component.html',
  styleUrls: ['./resolution-time.component.scss'],
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
export class ResolutionTimeComponent implements OnInit, OnDestroy {
  @Input() user?: IUser;
  @Input() project?: IProject;
  @Input() items?: IItem[];
  @Input() projectUsers?: IUserPartner[];
  @Input() epics?: IItem[];
  @Input() sprints?: ISprint[];

  chart?: any;
  totalItems = 0;
  itemReport: IItemResolutionTimeReport[] = [];
  itemsPerType: { [key: string]: number } = {};

  selectedSprints: ISprint[] = [];

  Object = Object;

  constructor(
    private translate: TranslateService,
  ) { }

  ngOnDestroy() {
    if (this.chart) this.chart.destroy();
  }

  ngOnInit() {
    this.initializeChart();
    this.createItemReport();
  }

  onSelectedSprintsChange() {
    this.initializeChart();
    this.createItemReport();
  }

  initializeChart() {
    if (this.chart) this.chart.destroy();

    this.totalItems = 0;

    const chartData: Map<string, number> = new Map();
    const doneTime: Map<string, number[]> = new Map();

    let itemList = this.items;
    if (this.selectedSprints.length) {
      itemList = this.items?.filter(item => this.selectedSprints.some(sprint =>
        item.sprintId && item.sprintId.length && item.sprintId.includes(sprint._id)
      ));
    }

    itemList?.forEach(item => {
      if (!item.done_date) {
        return;
      }
      this.totalItems += 1;

      const itemType = item.type;
      const itemDoneTime = moment(item.done_date).diff(moment(item.createdAt), 'days');
      doneTime.set(itemType, (doneTime.get(itemType) || []).concat(itemDoneTime));
    });

    doneTime.forEach((times, type) => {
      chartData.set(type, times.reduce((acc, curr) => acc + curr, 0) / times.length);
    });

    this.chart = new Chart('canvas', {
      type: 'polarArea',
      data: {
        labels: Array.from(chartData.keys()).map(type => this.translate.instant(type)),
        datasets: [{
          label: this.translate.instant('AVERAGE_TIME_TO_COMPLETE'),
          data: Array.from(chartData.values()),
          backgroundColor: Array.from(chartData.keys()).map(type =>
            ItemTypeColorMap[type as keyof typeof ItemTypeColorMap] + '88' ?? '#ffffff88'
          ),
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          }
        }
      },
    });
  }

  createItemReport() {
    this.itemReport = [];
    this.itemsPerType = {};

    let itemList = this.items;
    if (this.selectedSprints.length) {
      itemList = this.items?.filter(item => this.selectedSprints.some(sprint =>
        item.sprintId && item.sprintId.length && item.sprintId.includes(sprint._id)
      ));
    }

    itemList?.filter(i =>
      i.done_date
    ).forEach(item => {
      this.itemReport?.push({
        itemId: item._id,
        itemCode: item.code,
        itemName: item.name,
        itemType: item.type,
        itemDoneTime: moment(item.done_date).diff(moment(item.createdAt), 'days'),
      });

      this.itemsPerType[item.type!] = (this.itemsPerType[item.type!] || 0) + 1;
    });
    this.itemReport = this.itemReport.sort((a, b) => b.itemDoneTime - a.itemDoneTime);
  }
}
