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
import { EventType, IChartData, IChartDataItem } from 'src/app/models/chartData';
import { RouterModule } from '@angular/router';
import { ItemEstimateBadgeComponent } from 'src/app/modules/components/item-estimate-badge/item-estimate-badge.component';
import { ItemPropertyIconComponent } from 'src/app/modules/components/item-property-icon/item-property-icon.component';

@Component({
  selector: 'app-sprint-report',
  templateUrl: './sprint-report.component.html',
  styleUrls: ['./sprint-report.component.scss'],
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
export class SprintReportComponent implements OnInit {
  @Input() user?: IUser;
  @Input() project?: IProject;
  @Input() items?: IItem[];
  @Input() projectUsers?: IUserPartner[];
  @Input() epics?: IItem[];
  @Input() sprints?: ISprint[];

  chart?: any;
  completedItems: IItem[] = [];
  unfinishedItems: IItem[] = [];
  sprintStartEvent?: IChartData;
  sprintEndEvent?: IChartData;
  sprintStartTotal?: number = 0;
  sprintEndTotal?: number = 0;
  sprintCompletedTotal?: number = 0;
  sprintUnfinishedTotal?: number = 0;
  
  selectedSprint?: ISprint;
  selectedSprintId?: string;
  selectedMeasure: 'complexity' | 'hours' | 'item_count' = 'complexity';

  EventType = EventType;

  constructor(
    private translate: TranslateService,
    private chartDataService: ChartDataService,
  ) { }

  ngOnInit(): void {
    const activeSprintId = this.project?.currentSprintId;
    if (!activeSprintId) {
      this.selectedSprintId = this.sprints?.[0]?._id;
      this.selectedSprint = this.sprints?.[0];
    }
    else {
      this.selectedSprintId = activeSprintId;
      this.selectedSprint = this.sprints?.find(s => s._id === activeSprintId);
    }
    this.initializeChart();
  }

  onSprintChange(sprintId: string) {
    this.selectedSprintId = sprintId;
    this.selectedSprint = this.sprints?.find(s => s._id === sprintId);
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

    const sprint = this.sprints?.find(s => s._id === this.selectedSprintId);
    if (!this.user || !this.project || !sprint) return;

    const itemsAddedRemoved = await firstValueFrom(
      this.chartDataService.getChartData(
        this.user.access_token!,
        this.project._id,
        [sprint._id]
      )
    );

    const sprintItemIdsSet = new Set<string>();
    itemsAddedRemoved.forEach(i => {
      i.items.forEach(item => sprintItemIdsSet.add(item.itemId));
    });
    const sprintItemIds = Array.from(sprintItemIdsSet);

    let itemsChanged = await firstValueFrom(
      this.chartDataService.getChartData(
        this.user.access_token!,
        this.project._id,
        [sprint._id],
        sprintItemIds
      )
    );

    // Special case in which sprint was started/ended with no items
    // Add that chart data to the itemsChanged array
    const sprintStartEvent = itemsAddedRemoved.find(i => i.event_type === EventType.SPRINT_START);
    if (sprintStartEvent && sprintStartEvent.items.length === 0) {
      itemsChanged.unshift(sprintStartEvent);
    }
    const sprintEndEvent = itemsAddedRemoved.find(i => i.event_type === EventType.SPRINT_END);
    if (sprintEndEvent && sprintEndEvent.items.length === 0) {
      itemsChanged.push(sprintEndEvent);
    }

    // Get starting value
    let startingValue = 0;

    // Special case in which sprint was started with no items
    // Add all items from start day to the sprint start event and remove the added to sprint events for those items
    if (sprintStartEvent?.items.length === 0) {
      const startDay = moment(sprintStartEvent.createdAt).startOf('day');
      const startDayEnd = moment(sprintStartEvent.createdAt).endOf('day');
      const entriesFromStartDay = itemsChanged.filter(i =>
        i.event_type === EventType.ADDED_TO_SPRINT
        && moment(i.createdAt).isBetween(startDay, startDayEnd)
      );
      entriesFromStartDay.forEach(entry => {
        sprintStartEvent.items.push(...entry.items);
      });

      itemsChanged = itemsChanged.filter(i =>
        i.event_type !== EventType.ADDED_TO_SPRINT
        || !moment(i.createdAt).isBetween(startDay, startDayEnd)
      );
    }
    sprintStartEvent?.items.forEach(item => {
      startingValue = this.addMeasure(startingValue, item);
    });

    // Remove items that were added before sprint start
    itemsChanged = itemsChanged.filter(i => moment(i.createdAt).isSameOrAfter(sprintStartEvent?.createdAt));

    // Get sprint start total & sprint end total
    this.sprintStartTotal = sprintStartEvent?.items.reduce((acc, item) => this.addMeasure(acc, item), 0);

    this.sprintEndTotal = sprintEndEvent?.items.reduce((acc, item) => this.addMeasure(acc, item), 0);

    this.sprintStartEvent = sprintStartEvent;
    this.sprintEndEvent = sprintEndEvent;

    // Go through each day and create an array of days (skip weekends if needed)
    const numberOfDays = moment(sprint.end_date).diff(moment(sprint.start_date), 'days');
    const days: moment.Moment[] = [];
    const daysWithWeekends: moment.Moment[] = [];
    for(let i = 0; i <= numberOfDays; i++) {
      const day = moment(sprint.start_date).add(i, 'days');
      if (day.isoWeekday() === 6 || day.isoWeekday() === 7) {
        daysWithWeekends.push(day);
        continue;
      }
      days.push(day);
      daysWithWeekends.push(day);
    }
    const chartDays = days.map(d => d?.format() || null);

    // Create sequence of data
    const chartData: { x: string, y: number }[] = [];
    let currentValue = startingValue;

    itemsChanged.forEach(entry => {
      if (entry.event_type === EventType.SPRINT_START) {
        chartData.push({
          x: moment(entry.createdAt).format(),
          y: currentValue
        });
      }
      if (entry.event_type === EventType.SPRINT_END) {
        const lastDayTotal = entry.items.reduce((acc, item) => this.addMeasure(acc, item), 0);
        chartData.push({
          x: moment(entry.createdAt).format(),
          y: lastDayTotal,
        });
      }
      if (entry.event_type === EventType.ADDED_TO_SPRINT) {
        entry.items.forEach(item => {
          currentValue = this.addMeasure(currentValue, item);
        });
        chartData.push({
          x: moment(entry.createdAt).format(),
          y: currentValue
        });
      }
      if (entry.event_type === EventType.REMOVED_FROM_SPRINT) {
        entry.items.forEach(item => {
          currentValue = this.subtractMeasure(currentValue, item);
        });
        chartData.push({
          x: moment(entry.createdAt).format(),
          y: currentValue
        });
      }
      if (entry.event_type === EventType.ESTIMATE_UPDATED && this.selectedMeasure === 'hours') {
        const item = entry.items[0];
        currentValue += (item.estimate || 0) - (item.old_estimate || 0);
        chartData.push({
          x: moment(entry.createdAt).format(),
          y: currentValue
        });
      }
      if (entry.event_type === EventType.COMPLEXITY_UPDATED && this.selectedMeasure === 'complexity') {
        const item = entry.items[0];
        currentValue += (item.complexity || 0) - (item.old_complexity || 0);
        chartData.push({
          x: moment(entry.createdAt).format(),
          y: currentValue
        });
      }
      if (entry.event_type === EventType.ITEM_COMPLETED) {
        entry.items.forEach(item => {
          currentValue = this.subtractMeasure(currentValue, item);
        });
        chartData.push({
          x: moment(entry.createdAt).format(),
          y: currentValue
        });
      }
    });

    // Create ideal sequence
    const chartIdeal: { x: string, y: number }[] = [];
    const numberOfWeekendDays = daysWithWeekends.filter(d => d.isoWeekday() === 6 || d.isoWeekday() === 7).length;
    for(let i = 0, j = 0; i <= numberOfDays; i++) {
      const day = moment(sprint.start_date).add(i, 'days');
      if (day.isoWeekday() === 6 || day.isoWeekday() === 7) {
        chartIdeal.push({
          x: day.format(),
          y: chartIdeal[chartIdeal.length - 1]?.y
        });
      }
      else {
        chartIdeal.push({
          x: day.format(),
          y: startingValue - (startingValue / (numberOfDays - numberOfWeekendDays)) * j
        });
        j++;
      }
    }

    // Get total for completed items
    let completedCurrentValue = 0;
    const completedItemIdSet = new Set<string>();
    itemsChanged.forEach(entry => {
      if (entry.event_type === EventType.ITEM_COMPLETED) {
        entry.items.forEach(item => {
          completedCurrentValue = this.addMeasure(completedCurrentValue, item);
          completedItemIdSet.add(item.itemId);
        });
      }
    });
    this.sprintCompletedTotal = completedCurrentValue;
    this.completedItems = this.items?.filter(i => completedItemIdSet.has(i._id)) || [];

    // Create set of unfinished items
    let unfinishedCurrentValue = 0;
    const unfinishedItemsSet = new Set<string>();
    itemsChanged.forEach(entry => {
      if (entry.event_type === EventType.SPRINT_START) {
        entry.items.forEach(item => {
          unfinishedCurrentValue = this.addMeasure(unfinishedCurrentValue, item);
          unfinishedItemsSet.add(item.itemId);
        });
      }
      if (entry.event_type === EventType.ADDED_TO_SPRINT) {
        entry.items.forEach(item => {
          unfinishedCurrentValue = this.addMeasure(unfinishedCurrentValue, item);
          unfinishedItemsSet.add(item.itemId);
        });
      }
      if (entry.event_type === EventType.REMOVED_FROM_SPRINT) {
        entry.items.forEach(item => {
          unfinishedCurrentValue = this.subtractMeasure(unfinishedCurrentValue, item);
          unfinishedItemsSet.delete(item.itemId);
        });
      }
      if (entry.event_type === EventType.ITEM_COMPLETED) {
        entry.items.forEach(item => {
          unfinishedCurrentValue = this.subtractMeasure(unfinishedCurrentValue, item);
          unfinishedItemsSet.delete(item.itemId);
        });
      }
    });
    this.sprintUnfinishedTotal = unfinishedCurrentValue;
    this.unfinishedItems = this.items?.filter(i => unfinishedItemsSet.has(i._id)) || [];

    this.chart = new Chart('canvas', {
      type: 'line',
      data: {
        labels: chartDays,
        datasets: [
          {
            label: this.translate.instant('REMAINING'),
            data: chartData,
            borderColor: '#ff0000',
            fill: false,
            stepped: true,
          },
          {
            label: this.translate.instant('IDEAL'),
            data: chartIdeal,
            borderColor: '#afafaf',
            fill: false,
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
            }
          },
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
