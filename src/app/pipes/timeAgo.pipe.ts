import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import moment from 'moment';

@Pipe({
  standalone: true,
  name: 'timeAgo'
})
export class TimeAgoPipe implements PipeTransform {
  constructor(
    private translate: TranslateService,
  ) {}

  transform(value: Date): string {
    const date = new Date(value);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffSeconds < 60) {
      return this.translate.instant('JUST_NOW');
    }
    else if (diffSeconds < 120) {
      return this.translate.instant('A_MINUTE_AGO');
    }
    else if (diffSeconds < 3600) {
      return this.translate.instant('X_MINUTES_AGO', { minutes: Math.floor(diffSeconds / 60) });
    }
    else if (diffSeconds < 7200) {
      return this.translate.instant('AN_HOUR_AGO');
    }
    else if (diffSeconds < 86400) {
      return this.translate.instant('X_HOURS_AGO', { hours: Math.floor(diffSeconds / 3600) });
    }
    else {
      return moment(date).format('DD/MM/YYYY HH:mm');
    }
  }
}
