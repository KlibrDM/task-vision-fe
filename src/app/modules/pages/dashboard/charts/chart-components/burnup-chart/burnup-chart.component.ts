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
  
  selectedSprintId?: string;
  selectedMeasure: 'complexity' | 'hours' | 'item_count' = 'complexity';
  showWeekends = true;

  constructor(
    private translate: TranslateService
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

  onShowWeekendsChange(showWeekends: boolean) {
    this.showWeekends = showWeekends;
    this.initializeChart();
  }

  initializeChart() {
    if (this.chart) this.chart.destroy();

    const sprint = this.sprints?.find(s => s._id === this.selectedSprintId);
    if (!sprint) return;

    const numberOfDays = moment(sprint.end_date).diff(moment(sprint.start_date), 'days');
    const days: moment.Moment[] = [];
    const daysWithWeekends: moment.Moment[] = [];

    // Go through each day and create an array of days (skip weekends if needed)
    for(let i = 0; i <= numberOfDays; i++) {
      const day = moment(sprint.start_date).add(i, 'days');
      if (!this.showWeekends && (day.isoWeekday() === 6 || day.isoWeekday() === 7)) {
        daysWithWeekends.push(day);
        continue;
      }
      days.push(day);
      daysWithWeekends.push(day);
    }
    const chartDays = days.map(d => d?.format('DD MMM') || null);

    // Count completed values for each day
    const chartCompleted: number[] = [];
    const sprintItems = this.items?.filter(i => i.sprintId?.includes(this.selectedSprintId || ''));
    const currentDay = moment();
    days.forEach(day => {
      if (day.isAfter(currentDay)) return;

      const itemsToCount = sprintItems?.filter(i => i.done_date && moment(i.done_date).isSameOrBefore(day, 'day'));
      let dayValue = 0;
      if (itemsToCount) {
        itemsToCount.forEach(i => {
          switch (this.selectedMeasure) {
            case 'complexity':
              dayValue += i.complexity || 0;
              break;
            case 'hours':
              dayValue += i.estimate || 0;
              break;
            case 'item_count':
              dayValue += 1;
              break;
          }
        });
      }
      chartCompleted.push(dayValue);
    });

    // Count scope values for each day
    const chartScope: number[] = [];
    days.forEach(day => {
      if (day.isAfter(currentDay)) return;

      const itemsToCount = sprintItems?.filter(i => i.createdAt && moment(i.createdAt).isSameOrBefore(day, 'day'));
      let dayValue = 0;
      if (itemsToCount) {
        itemsToCount.forEach(i => {
          switch (this.selectedMeasure) {
            case 'complexity':
              dayValue += i.complexity || 0;
              break;
            case 'hours':
              dayValue += i.estimate || 0;
              break;
            case 'item_count':
              dayValue += 1;
              break;
          }
        });
      }
      chartScope.push(dayValue);
    });

    const chartIdeal: number[] = [];
    const numberOfWeekendDays = daysWithWeekends.filter(d => d.isoWeekday() === 6 || d.isoWeekday() === 7).length;
    const numberOfDaysToParse = this.showWeekends ? numberOfDays : numberOfDays - numberOfWeekendDays;
    for(let i = 0, j = 0; i <= numberOfDaysToParse; i++) {
      const day = moment(sprint.start_date).add(i, 'days');
      if (this.showWeekends && (day.isoWeekday() === 6 || day.isoWeekday() === 7)) {
        chartIdeal.push(chartIdeal[chartIdeal.length - 1]);
      }
      else {
        chartIdeal.push(0 + (chartScope[chartScope.length - 1] / (numberOfDays - numberOfWeekendDays)) * j);
        j++;
      }
    }

    this.chart = new Chart('canvas', {
      type: 'line',
      data: {
        labels: chartDays,
        datasets: [
          {
            label: this.translate.instant('COMPLETED'),
            data: chartCompleted,
            borderColor: '#56cc88',
            fill: false
          },
          {
            label: this.translate.instant('SCOPE'),
            data: chartScope,
            borderColor: '#3388ef',
            fill: false
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
          y: {
            beginAtZero: true
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
            position: 'nearest',
          }
        }
      },
    });
  }
}
