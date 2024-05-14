import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IUser, IUserPartner } from 'src/app/models/user';
import { IProject } from 'src/app/models/project';
import { IItem } from 'src/app/models/item';
import { ISprint } from 'src/app/models/sprint';
import { Chart } from 'chart.js/auto';
import moment from 'moment';
import 'chartjs-adapter-moment';
import { firstValueFrom } from 'rxjs';
import { ChartDataService } from 'src/app/services/chartData.service';
import { EventType, IChartDataItem } from 'src/app/models/chartData';
import { RouterModule } from '@angular/router';
import { ItemEstimateBadgeComponent } from 'src/app/modules/components/item-estimate-badge/item-estimate-badge.component';
import { ItemPropertyIconComponent } from 'src/app/modules/components/item-property-icon/item-property-icon.component';

@Component({
  selector: 'app-velocity-chart',
  templateUrl: './velocity-chart.component.html',
  styleUrls: ['./velocity-chart.component.scss'],
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
export class VelocityChartComponent implements OnInit {
  @Input() user?: IUser;
  @Input() project?: IProject;
  @Input() items?: IItem[];
  @Input() projectUsers?: IUserPartner[];
  @Input() epics?: IItem[];
  @Input() sprints?: ISprint[];

  chart?: any;
  tableData: (ISprint & { committed: number, completed: number })[] = [];
  averageVelocity = 0;
  
  selectedSprints?: ISprint[];
  selectedSprintIds?: string[];
  selectedMeasure: 'complexity' | 'hours' | 'item_count' = 'complexity';

  EventType = EventType;

  constructor(
    private translate: TranslateService,
    private chartDataService: ChartDataService,
  ) { }

  ngOnInit(): void {
    const activeSprintId = this.project?.currentSprintId;
    if (!activeSprintId) {
      // Get last 3 sprints
      const lastSprints = this.sprints?.filter(s => s.is_completed).slice(-3);
      this.selectedSprintIds = lastSprints?.map(s => s._id);
      this.selectedSprints = lastSprints;
    }
    else {
      let lastSprints = this.sprints?.filter(s => s.is_completed).slice(-3) || [];
      const activeSprint = this.sprints?.find(s => s._id === activeSprintId);
      lastSprints = lastSprints.filter(s => s._id !== activeSprintId);
      this.selectedSprintIds = [...lastSprints.map(s => s._id), activeSprintId];
      this.selectedSprints = activeSprint ? [...lastSprints, activeSprint] : [];
    }
    this.initializeChart();
  }

  onSprintChange(sprintIds: string[]) {
    this.selectedSprintIds = sprintIds;
    this.selectedSprints = this.sprints?.filter(s => sprintIds.includes(s._id));
    this.initializeChart();
  }

  onMeasureChange(measure: 'complexity' | 'hours' | 'item_count') {
    this.selectedMeasure = measure;
    this.initializeChart();
  }

  addMeasure(acc: number, item: IChartDataItem) {
    switch (this.selectedMeasure) {
      case 'complexity':
        return acc + (item.complexity || 0);
      case 'hours':
        return acc + (item.estimate || 0);
      case 'item_count':
        return acc + 1;
    }
  }

  subtractMeasure(acc: number, item: IChartDataItem) {
    switch (this.selectedMeasure) {
      case 'complexity':
        return acc - (item.complexity || 0);
      case 'hours':
        return acc - (item.estimate || 0);
      case 'item_count':
        return acc - 1;
    }
  }

  async initializeChart() {
    if (this.chart) this.chart.destroy();

    const committedChartData: { x: string, y: number }[] = [];
    const completedChartData: { x: string, y: number }[] = [];

    if (!this.user || !this.project || !this.selectedSprintIds) return;

    const itemsAddedRemoved = await firstValueFrom(
      this.chartDataService.getChartData(
        this.user.access_token!,
        this.project._id,
        this.selectedSprintIds
      )
    );

    const sprintItemIdsSet = new Set<string>();
    itemsAddedRemoved.forEach(i => {
      i.items.forEach(item => sprintItemIdsSet.add(item.itemId));
    });
    const sprintItemIds = Array.from(sprintItemIdsSet);

    const itemsChanged = await firstValueFrom(
      this.chartDataService.getChartData(
        this.user.access_token!,
        this.project._id,
        this.selectedSprintIds,
        sprintItemIds
      )
    );

    this.selectedSprintIds.forEach(sprintId => {
      const sprint = this.sprints?.find(s => s._id === sprintId);
      const sprintItemsAddedRemoved = itemsAddedRemoved.filter(i => i.sprintId?.includes(sprintId));
      const sprintItemsChanged = itemsChanged.filter(i => i.sprintId?.includes(sprintId));

      // Special case in which sprint was started/ended with no items
      // Add that chart data to the itemsChanged array
      const sprintStartEvent = sprintItemsAddedRemoved.find(i => i.event_type === EventType.SPRINT_START);

      // Special case in which sprint was started with no items
      // Add all items from start day to the sprint start event and remove the added to sprint events for those items
      if (sprintStartEvent?.items.length === 0) {
        const startDay = moment(sprintStartEvent.createdAt).startOf('day');
        const startDayEnd = moment(sprintStartEvent.createdAt).endOf('day');
        const entriesFromStartDay = sprintItemsChanged.filter(i =>
          i.event_type === EventType.ADDED_TO_SPRINT
          && moment(i.createdAt).isBetween(startDay, startDayEnd)
        );
        entriesFromStartDay.forEach(entry => {
          sprintStartEvent.items.push(...entry.items);
        });
      }

      // Get sprint start total
      committedChartData.push({
        x: sprint?.name || '',
        y: sprintStartEvent?.items.reduce((acc, item) => this.addMeasure(acc, item), 0) || 0,
      })

      // Get sprint completed total
      let completedCurrentValue = 0;
      sprintItemsChanged.forEach(entry => {
        if (entry.event_type === EventType.ITEM_COMPLETED) {
          entry.items.forEach(item => {
            completedCurrentValue = this.addMeasure(completedCurrentValue, item);
          });
        }
      });
      completedChartData.push({
        x: sprint?.name || '',
        y: completedCurrentValue,
      });
    });

    this.tableData = this.selectedSprints?.map((sprint, i) => ({
      ...sprint,
      committed: committedChartData[i].y,
      completed: completedChartData[i].y,
    })) || [];

    this.averageVelocity = completedChartData.length
      ? completedChartData.reduce((acc, data) => acc + data.y, 0) / completedChartData.length
      : 0;

    this.chart = new Chart('canvas', {
      data: {
        datasets: [
          {
            type: 'bar',
            label: this.translate.instant('COMMITTED'),
            data: committedChartData,
            backgroundColor: '#606060',
          },
          {
            type: 'bar',
            label: this.translate.instant('COMPLETED'),
            data: completedChartData,
            backgroundColor: '#228f3f',
          },
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          },
        }
      },
    });
  }
}
