import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IUser, IUserPartner } from 'src/app/models/user';
import { FileTypePipe } from 'src/app/pipes/fileType.pipe';
import { IUploadedDoc } from 'src/app/models/uploadedDocs';
import { ProjectRole } from 'src/app/models/project';
import { DocsService } from 'src/app/services/docs.service';
import { ToastController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-doc-access',
  templateUrl: './doc-access.component.html',
  styleUrls: ['./doc-access.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    FileTypePipe,
  ]
})
export class DocAccessComponent implements OnChanges {
  @Input() user?: IUser;
  @Input() isAccessOpen = false;
  @Input() doc?: IUploadedDoc;
  @Input() projectUsers?: IUserPartner[];
  @Output() accessClose = new EventEmitter<void>();
  @Output() accessSave = new EventEmitter<IUploadedDoc>();

  projectRoles = Object.values(ProjectRole);

  newRoles: ProjectRole[] = [];
  newUsers: string[] = [];

  constructor(
    private translate: TranslateService,
    private docsService: DocsService,
    private toastController: ToastController,
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isAccessOpen'] && changes['isAccessOpen'].currentValue) {
      this.newRoles = [];
      this.newUsers = [];
      if (this.doc) {
        this.newRoles = structuredClone(this.doc.roles) ?? [];
        this.newUsers = structuredClone(this.doc.users) ?? [];
      }
    }
  }

  getUserNameAtId(id?: string) {
    if (!id) {
      return this.translate.instant('UNKNOWN');
    }
    const user = this.projectUsers!.find(e => e._id === id);
    return user ? user.first_name + ' ' + user.last_name : this.translate.instant('UNKNOWN');
  }

  closeDetails() {
    this.accessClose.emit();
  }

  saveDetails() {
    this.docsService.updateDocAccess(this.user!.access_token!, this.doc!.projectId, this.doc!._id, this.newRoles, this.newUsers).subscribe({
      next: (doc) => {
        this.accessSave.emit(doc);
      },
      error: () => {
        this.accessClose.emit();
        this.toastController.create({
          message: this.translate.instant('ERROR_WHILE_UPDATING_ACCESS'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      }
    });
  }

  onRoleChange(event: any) {
    if (event.target.checked) {
      this.newRoles.push(event.target.value);
    }
    else {
      this.newRoles = this.newRoles.filter(e => e !== event.target.value);
    }
  }

  onUserChange(event: any) {
    if (event.target.checked) {
      this.newUsers.push(event.target.value);
    }
    else {
      this.newUsers = this.newUsers.filter(e => e !== event.target.value);
    }
  }
}
