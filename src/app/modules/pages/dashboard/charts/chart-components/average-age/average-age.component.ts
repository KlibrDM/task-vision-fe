import { Component, Input, OnDestroy, OnInit } from '@angular/core';
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

interface IItemReport {
  itemId: string;
  itemCode: string;
  itemName: string;
  itemColumn: string;
  itemType: ItemType;
  itemAge: number;
}

@Component({
  selector: 'app-average-age',
  templateUrl: './average-age.component.html',
  styleUrls: ['./average-age.component.scss'],
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
export class AverageAgeComponent implements OnInit, OnDestroy {
  @Input() user?: IUser;
  @Input() project?: IProject;
  @Input() items?: IItem[];
  @Input() projectUsers?: IUserPartner[];
  @Input() epics?: IItem[];
  @Input() sprints?: ISprint[];

  chart?: any;
  itemReport: IItemReport[] = [];
  itemsPerColumn: { [key: string]: number } = {};

  selectedItemTypes: ItemType[] = [];
  itemTypes = Object.values(ItemType);

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

  onItemTypesChange() {
    this.initializeChart();
    this.createItemReport();
  }

  initializeChart() {
    if (this.chart) this.chart.destroy();

    const chartData: Map<string, number> = new Map();
    const columnItemAges: Map<string, number[]> = new Map();

    this.items?.forEach(item => {
      if (!item.column || item.column === '' || item.column === this.project?.done_column) {
        return;
      }

      if (this.selectedItemTypes.length > 0 && !this.selectedItemTypes.includes(item.type)) {
        return;
      }

      const itemColumn = item.column!;
      const itemAge = moment().diff(moment(item.createdAt), 'days');
      columnItemAges.set(itemColumn, (columnItemAges.get(itemColumn) || []).concat(itemAge));
    });

    columnItemAges.forEach((ages, column) => {
      chartData.set(column, ages.reduce((acc, curr) => acc + curr, 0) / ages.length);
    });

    this.chart = new Chart('canvas', {
      type: 'polarArea',
      data: {
        labels: Array.from(chartData.keys()),
        datasets: [{
          label: this.translate.instant('AVERAGE_AGE'),
          data: Array.from(chartData.values()),
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
    this.itemsPerColumn = {};

    this.items?.filter(i =>
      i.column
      && i.column !== this.project?.done_column
      && (this.selectedItemTypes.length === 0 || this.selectedItemTypes.includes(i.type))
    ).forEach(item => {
      this.itemReport?.push({
        itemId: item._id,
        itemCode: item.code,
        itemName: item.name,
        itemColumn: item.column || '',
        itemType: item.type,
        itemAge: moment().diff(moment(item.createdAt), 'days'),
      });

      this.itemsPerColumn[item.column!] = (this.itemsPerColumn[item.column!] || 0) + 1;
    });
    this.itemReport = this.itemReport.sort((a, b) => b.itemAge - a.itemAge);
  }
}
