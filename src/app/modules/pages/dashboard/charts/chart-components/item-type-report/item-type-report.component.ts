import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IUser, IUserPartner } from 'src/app/models/user';
import { IProject } from 'src/app/models/project';
import { IItem, ItemTypeColorMap } from 'src/app/models/item';
import { ISprint } from 'src/app/models/sprint';
import { Chart } from 'chart.js/auto';
import 'chartjs-adapter-moment';
import { RouterModule } from '@angular/router';
import { ItemEstimateBadgeComponent } from 'src/app/modules/components/item-estimate-badge/item-estimate-badge.component';
import { ItemPropertyIconComponent } from 'src/app/modules/components/item-property-icon/item-property-icon.component';

@Component({
  selector: 'app-item-type-report',
  templateUrl: './item-type-report.component.html',
  styleUrls: ['./item-type-report.component.scss'],
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
export class ItemTypeReportComponent implements OnInit, OnDestroy {
  @Input() user?: IUser;
  @Input() project?: IProject;
  @Input() items?: IItem[];
  @Input() projectUsers?: IUserPartner[];
  @Input() epics?: IItem[];
  @Input() sprints?: ISprint[];

  chart?: any;
  totalItems = 0;
  itemReport: { type: string, count: number, completed: number, unfinished: number }[] = [];
  itemReportTotals: { count: number, completed: number, unfinished: number } = {
    count: 0,
    completed: 0,
    unfinished: 0
  };

  selectedSprints: ISprint[] = [];

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

    const chartData: Map<string, number> = new Map();
    let itemList = this.items;
    if (this.selectedSprints.length) {
      itemList = this.items?.filter(item => this.selectedSprints.some(sprint =>
        item.sprintId && item.sprintId.length && item.sprintId.includes(sprint._id)
      ));
    }
    this.totalItems = itemList?.length || 0;

    itemList?.forEach(item => {
      if (!chartData.has(item.type)) {
        chartData.set(item.type, 0);
      }
      chartData.set(item.type, chartData.get(item.type)! + 1);
    });

    this.chart = new Chart('canvas', {
      type: 'doughnut',
      data: {
        labels: Array.from(chartData.keys()).map(type => this.translate.instant(type)),
        datasets: [{
          label: this.translate.instant('ITEMS'),
          data: Array.from(chartData.values()),
          backgroundColor: Array.from(chartData.keys()).map(type =>
            ItemTypeColorMap[type as keyof typeof ItemTypeColorMap] ?? '#ffffff'
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

    let itemList = this.items;
    if (this.selectedSprints.length) {
      itemList = this.items?.filter(item => this.selectedSprints.some(sprint =>
        item.sprintId && item.sprintId.length && item.sprintId.includes(sprint._id)
      ));
    }

    const dataMap: Map<string, number> = new Map();
    itemList?.forEach(item => {
      if (!dataMap.has(item.type)) {
        dataMap.set(item.type, 0);
      }
      dataMap.set(item.type, dataMap.get(item.type)! + 1);
    });

    this.itemReport = Array.from(dataMap.keys()).map(type => {
      const count = dataMap.get(type)!;
      const completed = itemList?.filter(item =>
        item.type === type
        && (item.column === this.project?.done_column || item.done_date)
      ).length || 0;
      return {
        type,
        count,
        completed,
        unfinished: count - completed,
      }
    });

    this.itemReportTotals = this.itemReport.reduce((acc, item) => ({
      count: acc.count + item.count,
      completed: acc.completed + item.completed,
      unfinished: acc.unfinished + item.unfinished,
    }), { count: 0, completed: 0, unfinished: 0 });
  }
}
