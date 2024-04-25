import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { refreshOutline } from 'ionicons/icons';
import { IUser, IUserPartner } from 'src/app/models/user';
import { ILog, ILogAdditionalData, LogEntities } from 'src/app/models/log';
import { IProject } from 'src/app/models/project';
import { LogService } from 'src/app/services/log.service';
import { ToastController } from '@ionic/angular/standalone';
import { LogsListComponent } from '../logs-list/logs-list.component';
import { PaginationComponent } from '../pagination/pagination.component';

@Component({
  selector: 'app-logs-controller',
  templateUrl: './logs-controller.component.html',
  styleUrls: ['./logs-controller.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    TranslateModule,
    LogsListComponent,
    PaginationComponent,
  ]
})
export class LogsControllerComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() showOpenButton = true;
  @Input() user?: IUser;
  @Input() project?: IProject;
  @Input() projectUsers?: IUserPartner[];
  @Input() idList?: { id: string, name: string }[];
  @Input() entityId?: string;
  @Input() isProjectLogs = false;
  @Input() projectLogsEntities?: LogEntities[];
  @Input() forceRefreshLogs = Symbol('');
  @Input() limit = 10;

  logs?: (ILog & ILogAdditionalData)[] = [];
  logsCount = 0;
  pages = 1;
  currentPage = 1;
  offset = 0;

  constructor(
    private logService: LogService,
    private toastController: ToastController,
    private translate: TranslateService,
  ) {
    addIcons({
      refreshOutline,
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entityId'] && changes['entityId'].currentValue) {
      this.getLogsForEntityId(changes['entityId'].currentValue);
    }
    if (changes['isProjectLogs'] && changes['isProjectLogs'].currentValue) {
      this.getProjectLogs();
    }
    if (this.isProjectLogs && changes['projectLogsEntities'] && changes['projectLogsEntities'].currentValue) {
      this.getProjectLogs();
    }
    if (this.isProjectLogs && changes['project'] && changes['project'].currentValue) {
      this.getProjectLogs();
    }
    if (changes['forceRefreshLogs'] && changes['forceRefreshLogs'].currentValue) {
      this.logs = [];
      this.getProjectLogs();
    }
  }

  getLogsForEntityId(entityId: string) {
    if (this.user && this.project) {
      this.logService.getLogs(this.user!.access_token!, entityId, this.offset, this.limit).subscribe({
        next: (data) => {
          this.logs = this.processLogs(data.logs);
          this.logsCount = data.count;
        },
        error: () => {
          this.logs = [];
          this.logsCount = 0;
          this.toastController.create({
            message: this.translate.instant('ERROR_FETCHING_LOGS'),
            duration: 4000,
            color: 'danger'
          }).then((toast) => toast.present());
        }
      });
    }
  }

  getProjectLogs() {
    if (this.user && this.project) {
      this.logService.getProjectLogs(this.user!.access_token!, this.project._id, this.offset, this.limit, this.projectLogsEntities).subscribe({
        next: (data) => {
          this.logs = this.processLogs(data.logs);
          this.logsCount = data.count;
        },
        error: () => {
          this.logs = [];
          this.logsCount = 0;
          this.toastController.create({
            message: this.translate.instant('ERROR_FETCHING_LOGS'),
            duration: 4000,
            color: 'danger'
          }).then((toast) => toast.present());
        }
      });
    }
  }

  processLogs(logs: (ILog & ILogAdditionalData)[]): ILog[] {
    return logs.map((log) => {
      // Process objects
      if (log?.oldValue?.[0] === '{' && log.oldValue[log.oldValue.length - 1] === '}') {
        try {
          const jsonValue = JSON.parse(log.oldValue);
          if (jsonValue._id) {
            delete jsonValue._id;
          }
          if (jsonValue.__v) {
            delete jsonValue.__v;
          }
          const arr = Object.entries(jsonValue);
          log.oldValueArray = arr.map(([key, value]) => [key, (value as any).toString()]);
        }
        catch (e) {
          log.oldValueArray = [];
        }
      }
      if (log?.newValue?.[0] === '{' && log.newValue[log.newValue.length - 1] === '}') {
        try {
          const jsonValue = JSON.parse(log.newValue);
          if (jsonValue._id) {
            delete jsonValue._id;
          }
          if (jsonValue.__v) {
            delete jsonValue.__v;
          }
          const arr = Object.entries(jsonValue);
          log.newValueArray = arr.map(([key, value]) => [key, (value as any).toString()]);
        }
        catch (e) {
          log.newValueArray = [];
        }
      }

      // Process arrays
      if (log?.oldValue?.[0] === '[' && log.oldValue[log.oldValue.length - 1] === ']') {
        try {
          const arr = JSON.parse(log.oldValue);
          log.oldValue = arr.toString().replace(/,/g, ', ');
        }
        catch (e) {
          log.oldValue = '';
        }
      }
      if (log?.newValue?.[0] === '[' && log.newValue[log.newValue.length - 1] === ']') {
        try {
          const arr = JSON.parse(log.newValue);
          log.newValue = arr.toString().replace(/,/g, ', ');
        }
        catch (e) {
          log.newValue = '';
        }
      }

      return log;
    });
  }

  toggleIsOpen() {
    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      if (this.isProjectLogs) {
        this.getProjectLogs();
      }
      else {
        this.getLogsForEntityId(this.entityId!);
      }
    }
  }

  refreshLogs() {
    if (this.isProjectLogs) {
      this.getProjectLogs();
    }
    else {
      this.getLogsForEntityId(this.entityId!);
    }
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.offset = (page - 1) * this.limit;

    if (this.isProjectLogs) {
      this.getProjectLogs();
    }
    else {
      this.getLogsForEntityId(this.entityId!);
    }
  }

  onLimitChange(limit: number) {
    this.limit = limit;
    this.offset = 0;
    this.currentPage = 1;

    if (this.isProjectLogs) {
      this.getProjectLogs();
    }
    else {
      this.getLogsForEntityId(this.entityId!);
    }
  }
}
