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

interface ITableData {
  date: string;
  items: {
    id: string;
    code: string;
    name: string;
    oldValue?: string;
    newValue?: string;
    valueType?: 'complexity' | 'estimate';
  }[];
  eventType: EventType;
}

@Component({
  selector: 'app-burnup-chart',
  templateUrl: './burnup-chart.component.html',
  styleUrls: ['./burnup-chart.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    RouterModule,
  ]
})
export class BurnupChartComponent implements OnInit {
  @Input() user?: IUser;
  @Input() project?: IProject;
  @Input() items?: IItem[];
  @Input() projectUsers?: IUserPartner[];
  @Input() epics?: IItem[];
  @Input() sprints?: ISprint[];

  chart?: any;
  tableData: ITableData[] = [];
  sprintStartTotal?: number = 0;
  sprintEndTotal?: number = 0;
  
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
    }
    else {
      this.selectedSprintId = activeSprintId;
    }
    this.initializeChart();
  }

  onSprintChange(sprintId: string) {
    this.selectedSprintId = sprintId;
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

    // Create sequence of completed items
    const chartCompleted: { x: string, y: number }[] = [];
    let completedCurrentValue = 0;
    itemsChanged.forEach(entry => {
      if (entry.event_type === EventType.ITEM_COMPLETED) {
        entry.items.forEach(item => {
          completedCurrentValue = this.addMeasure(completedCurrentValue, item);
        });
        chartCompleted.push({
          x: moment(entry.createdAt).format(),
          y: completedCurrentValue
        });
      }
    });

    // Create sequence of scope change
    const chartScope: { x: string, y: number }[] = [];
    let scopeCurrentValue = startingValue;
    itemsChanged.forEach(entry => {
      if (entry.event_type === EventType.SPRINT_START) {
        chartScope.push({
          x: moment(entry.createdAt).format(),
          y: scopeCurrentValue
        });
      }
      if (entry.event_type === EventType.ADDED_TO_SPRINT) {
        entry.items.forEach(item => {
          scopeCurrentValue = this.addMeasure(scopeCurrentValue, item);
        });
        chartScope.push({
          x: moment(entry.createdAt).format(),
          y: scopeCurrentValue
        });
      }
      if (entry.event_type === EventType.REMOVED_FROM_SPRINT) {
        entry.items.forEach(item => {
          scopeCurrentValue = this.subtractMeasure(scopeCurrentValue, item);
        });
        chartScope.push({
          x: moment(entry.createdAt).format(),
          y: scopeCurrentValue
        });
      }
      if (entry.event_type === EventType.ESTIMATE_UPDATED && this.selectedMeasure === 'hours') {
        const item = entry.items[0];
        scopeCurrentValue += (item.estimate || 0) - (item.old_estimate || 0);
        chartScope.push({
          x: moment(entry.createdAt).format(),
          y: scopeCurrentValue
        });
      }
      if (entry.event_type === EventType.COMPLEXITY_UPDATED && this.selectedMeasure === 'complexity') {
        const item = entry.items[0];
        scopeCurrentValue += (item.complexity || 0) - (item.old_complexity || 0);
        chartScope.push({
          x: moment(entry.createdAt).format(),
          y: scopeCurrentValue
        });
      }
    });
    // Add scope value for current day if it's after sprint start
    const currentDate = moment();
    if (currentDate.isSameOrAfter(moment(sprintStartEvent?.createdAt)) && currentDate.isBefore(moment(sprintEndEvent?.createdAt))) {
      chartScope.push({
        x: moment().format(),
        y: scopeCurrentValue
      });
    }
    // Add scope value for sprint end
    if (sprintEndEvent) {
      chartScope.push({
        x: moment(sprintEndEvent.createdAt).format(),
        y: scopeCurrentValue
      });
    }

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
          y: 0 + (chartScope[chartScope.length - 1]?.y / (numberOfDays - numberOfWeekendDays)) * j
        });
        j++;
      }
    }

    this.initializeTable(itemsChanged);

    this.chart = new Chart('canvas', {
      type: 'line',
      data: {
        labels: chartDays,
        datasets: [
          {
            label: this.translate.instant('SCOPE'),
            data: chartScope,
            borderColor: '#3388ef',
            fill: false,
            stepped: true,
          },
          {
            label: this.translate.instant('COMPLETED'),
            data: chartCompleted,
            borderColor: '#56cc88',
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

  initializeTable(itemsChanged: IChartData[]) {
    this.tableData = itemsChanged.map(entry => {
      return {
        date: moment(entry.createdAt).format('DD MMM YYYY, HH:mm'),
        items: entry.items.map(item => {
          const fullItem = this.items?.find(i => i._id === item.itemId)
          return {
            id: item.itemId,
            code: fullItem?.code || '',
            name: fullItem?.name || '',
            oldValue: item.old_complexity?.toString() || item.old_estimate?.toString() || '',
            newValue: item.complexity?.toString() || item.estimate?.toString() || '',
            valueType: item.complexity
              ? 'complexity'
              : item.estimate
                ? 'estimate'
                : undefined
          }
        }),
        eventType: entry.event_type
      }
    });
  }
}
