import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IUserPartner } from 'src/app/models/user';
import { FileTypePipe } from 'src/app/pipes/fileType.pipe';
import { IUploadedDoc } from 'src/app/models/uploadedDocs';

@Component({
  selector: 'app-doc-details',
  templateUrl: './doc-details.component.html',
  styleUrls: ['./doc-details.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    FileTypePipe,
  ]
})
export class DocDetailsComponent {
  @Input() isDetailsOpen = false;
  @Input() detailsDoc?: IUploadedDoc;
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
