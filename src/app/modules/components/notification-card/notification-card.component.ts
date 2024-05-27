import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { INotification, NotificationType } from 'src/app/models/notification';
import { IUserPartner } from 'src/app/models/user';
import { TimeAgoPipe } from 'src/app/pipes/timeAgo.pipe';

@Component({
  selector: 'app-notification-card',
  templateUrl: './notification-card.component.html',
  styleUrls: ['./notification-card.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    RouterModule,
    TimeAgoPipe,
  ]
})
export class NotificationCardComponent {
  @Input() notification?: INotification;
  @Input() currentUserId?: string;
  @Input() projectUsers: IUserPartner[] = [];

  notificationType = NotificationType;

  constructor(
    private translate: TranslateService
  ) {}

  getUserNameAtId(id?: string) {
    if (!id) {
      return this.translate.instant('UNKNOWN');
    }
    const user = this.projectUsers!.find(e => e._id === id);
    return user ? user.first_name + ' ' + user.last_name : this.translate.instant('UNKNOWN');
  }
}
