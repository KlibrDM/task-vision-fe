import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IUserPartner } from 'src/app/models/user';
import { ICollabDoc } from 'src/app/models/collabDocs';

@Component({
  selector: 'app-page-details',
  templateUrl: './page-details.component.html',
  styleUrls: ['./page-details.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
  ]
})
export class PageDetailsComponent {
  @Input() isDetailsOpen = false;
  @Input() detailsDoc?: ICollabDoc;
  @Input() projectUsers?: IUserPartner[];
  @Output() detailsClose = new EventEmitter<void>();

  constructor(
    private translate: TranslateService,
  ) { }

  getUserNameAtId(id?: string) {
    if (!id) {
      return this.translate.instant('UNKNOWN');
    }
    const user = this.projectUsers!.find(e => e._id === id);
    return user ? user.first_name + ' ' + user.last_name : this.translate.instant('UNKNOWN');
  }

  closeDetails() {
    this.detailsClose.emit();
  }
}
