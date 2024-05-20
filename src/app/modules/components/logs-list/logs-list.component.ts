import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IUserOrganizationPartner, IUserPartner } from 'src/app/models/user';
import { ILog, ILogAdditionalData, LogAction, LogEntities, LogTrigger } from 'src/app/models/log';
import { ItemPropertyIconComponent } from '../item-property-icon/item-property-icon.component';

@Component({
  selector: 'app-logs-list',
  templateUrl: './logs-list.component.html',
  styleUrls: ['./logs-list.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    TranslateModule,
    ItemPropertyIconComponent,
  ]
})
export class LogsListComponent {
  @Input() logs?: (ILog & ILogAdditionalData)[] = [];
  @Input() projectUsers?: (IUserPartner | IUserOrganizationPartner)[];
  @Input() idList?: { id: string, name: string }[];
  @Input() logsType: 'project' | 'entity' | 'user' = 'entity';

  LogTrigger = LogTrigger;
  LogEntities = LogEntities;
  LogAction = LogAction;

  constructor(private translate: TranslateService) {}

  getUserName(userId: string): string {
    if (this.projectUsers) {
      const user = this.projectUsers.find((user) => user._id === userId);
      return user ? user.first_name + ' ' + user.last_name.substring(0, 1) + '.' : '';
    }
    return '';
  }

  getNameFromEntityList(entity?: string): string {
    // If there is nothing, return not set
    if (!entity) {
      return this.translate.instant('NOT_SET');
    }

    // If it's all uppercase, it's probably translation code
    // Try to translate and return it
    if (entity === entity.toUpperCase()) {
      return this.translate.instant(entity);
    }

    // If we got here, maybe it's an id from the list so look for it
    if (this.idList) {
      const item = this.idList.find((item) => item.id === entity);
      return item ? item.name : entity;
    }

    // All hope lost, just return as is
    return entity;
  }

  beautifyFieldName(fieldName: string): string {
    return fieldName.replace(/_/g, ' ').replace(/\b\w/g, (match) => {
      return match.toUpperCase();
    });
  }
}
