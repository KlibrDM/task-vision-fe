import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IUser, IUserPartner } from 'src/app/models/user';
import { ILog, LogTrigger } from 'src/app/models/log';
import { IProject } from 'src/app/models/project';
import { LogService } from 'src/app/services/log.service';
import { ToastController } from '@ionic/angular/standalone';
import { LogsListComponent } from '../logs-list/logs-list.component';
import { PaginationComponent } from '../pagination/pagination.component';
import { AbsPipe } from 'src/app/pipes/abs.pipe';

interface ActivityView { 
  dateGroup: string,
  logs: ILog[],
}

@Component({
  selector: 'app-hour-activity',
  templateUrl: './hour-activity.component.html',
  styleUrls: ['./hour-activity.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    TranslateModule,
    LogsListComponent,
    PaginationComponent,
    AbsPipe,
  ]
})
export class HourActivityComponent implements OnChanges {
  @Input() user?: IUser;
  @Input() project?: IProject;
  @Input() projectUsers?: IUserPartner[];
  @Input() entityId?: string;
  logs?: ILog[] = [];
  logsCount = 0;

  activityView: ActivityView[] = [];

  LogTrigger = LogTrigger;
  Number = Number;

  constructor(
    private logService: LogService,
    private toastController: ToastController,
    private translate: TranslateService,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entityId'] && changes['entityId'].currentValue) {
      this.getLogsForEntityId(changes['entityId'].currentValue);
    }
  }

  getLogsForEntityId(entityId: string) {
    if (this.user && this.project) {
      this.logService.getLogs(this.user!.access_token!, entityId, undefined, undefined, 'hours_left').subscribe({
        next: (data) => {
          this.logs = data.logs;
          this.logsCount = data.count;
          this.activityView = this.groupLogsByDate(this.logs);
        },
        error: () => {
          this.logs = [];
          this.logsCount = 0;
          this.activityView = [];
          this.toastController.create({
            message: this.translate.instant('ERROR_FETCHING_LOGS'),
            duration: 4000,
            color: 'danger'
          }).then((toast) => toast.present());
        }
      });
    }
  }

  groupLogsByDate(logs: ILog[]): ActivityView[] {
    const groupedLogs: {
      dateGroup: string,
      logs: ILog[],
    }[] = [];

    logs.forEach((log) => {
      const dateGroup = new Date(log.createdAt!).toDateString();
      const group = groupedLogs.find((group) => group.dateGroup === dateGroup);
      if (group) {
        group.logs.push(log);
      }
      else {
        groupedLogs.push({
          dateGroup,
          logs: [log],
        });
      }
    });
    return groupedLogs;
  }

  refreshLogs() {
    this.getLogsForEntityId(this.entityId!);
  }

  getUserName(userId: string): string {
    if (this.projectUsers) {
      const user = this.projectUsers.find((user) => user._id === userId);
      return user ? user.first_name + ' ' + user.last_name : '';
    }
    return '';
  }
}
