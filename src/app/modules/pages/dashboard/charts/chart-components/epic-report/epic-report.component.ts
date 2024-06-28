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
  itemEstimate: number;
  itemComplexity: number;
}

@Component({
  selector: 'app-epic-report',
  templateUrl: './epic-report.component.html',
  styleUrls: ['./epic-report.component.scss'],
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
export class EpicReportComponent implements OnInit, OnDestroy {
  @Input() user?: IUser;
  @Input() project?: IProject;
  @Input() items?: IItem[];
  @Input() projectUsers?: IUserPartner[];
  @Input() epics?: IItem[];
  @Input() sprints?: ISprint[];

  chart?: any;
  unfinishedItemsReport: IItemReport[] = [];
  completedItemsReport: IItemReport[] = [];

  selectedEpic: IItem | undefined;
  noLinkedItemsWarning = false;

  constructor(
    private translate: TranslateService,
  ) { }

  ngOnDestroy() {
    if (this.chart) this.chart.destroy();
  }

  ngOnInit() {
    this.selectedEpic = this.epics?.[this.epics.length - 1];
    this.initializeChart();
    this.createItemReport();
  }

  onSelectedEpicChange() {
    this.initializeChart();
    this.createItemReport();
  }

  initializeChart() {
    if (this.chart) this.chart.destroy();

    const epicItems = this.items?.filter(i => i.epicId === this.selectedEpic?._id);
    if (!epicItems?.length) {
      this.noLinkedItemsWarning = true;
      return;
    }
    this.noLinkedItemsWarning = false;
    const epicCompletedCount = epicItems.filter(i => i.column === this.project?.done_column || i.done_date).length || 0;
    const epicUnfinishedCount = epicItems.length - epicCompletedCount || 0;

    this.chart = new Chart('canvas', {
      type: 'pie',
      data: {
        labels: [
          this.translate.instant('COMPLETED'),
          this.translate.instant('UNFINISHED'),
        ],
        datasets: [
          {
            label: this.translate.instant('ITEMS'),
            data: [epicCompletedCount, epicUnfinishedCount],
            backgroundColor: [
              'rgba(25, 200, 255, 0.6)',
              'rgba(255, 100, 140, 0.6)',
            ],
            borderColor: [
              'rgba(25, 200, 255, 1)',
              'rgba(255, 100, 140, 1)',
            ],
            borderWidth: 1
          }
        ]
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
    this.unfinishedItemsReport = [];
    this.completedItemsReport = [];

    const epicItems = this.items?.filter(i => i.epicId === this.selectedEpic?._id);
    if (!epicItems?.length) {
      return;
    }

    epicItems.forEach(item => {
      const itemReport: IItemReport = {
        itemId: item._id,
        itemCode: item.code,
        itemName: item.name,
        itemColumn: item.column || '',
        itemType: item.type,
        itemAge: moment().diff(moment(item.createdAt), 'days'),
        itemEstimate: item.estimate || 0,
        itemComplexity: item.complexity || 0,
      };

      if (item.column === this.project?.done_column || item.done_date) {
        this.completedItemsReport.push(itemReport);
      } else {
        this.unfinishedItemsReport.push(itemReport);
      }
    });
  }
}
