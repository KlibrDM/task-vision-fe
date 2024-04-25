import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IUser, IUserPartner } from 'src/app/models/user';
import { FileTypePipe } from 'src/app/pipes/fileType.pipe';
import { ProjectRole } from 'src/app/models/project';
import { ToastController } from '@ionic/angular/standalone';
import { ICollabDoc } from 'src/app/models/collabDocs';
import { CollabDocsService } from 'src/app/services/collabDocs.service';

@Component({
  selector: 'app-page-access',
  templateUrl: './page-access.component.html',
  styleUrls: ['./page-access.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    FileTypePipe,
  ]
})
export class PageAccessComponent implements OnChanges {
  @Input() user?: IUser;
  @Input() isAccessOpen = false;
  @Input() doc?: ICollabDoc;
  @Input() projectUsers?: IUserPartner[];
  @Output() accessClose = new EventEmitter<void>();
  @Output() accessSave = new EventEmitter<ICollabDoc>();

  projectRoles = Object.values(ProjectRole);

  newViewRoles: ProjectRole[] = [];
  newViewUsers: string[] = [];
  newEditRoles: ProjectRole[] = [];
  newEditUsers: string[] = [];

  constructor(
    private translate: TranslateService,
    private collabDocsService: CollabDocsService,
    private toastController: ToastController,
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isAccessOpen'] && changes['isAccessOpen'].currentValue) {
      this.newViewRoles = [];
      this.newViewUsers = [];
      this.newEditRoles = [];
      this.newEditUsers = [];
      if (this.doc) {
        this.newViewRoles = structuredClone(this.doc.roles) ?? [];
        this.newViewUsers = structuredClone(this.doc.users) ?? [];
        this.newEditRoles = structuredClone(this.doc.edit_roles) ?? [];
        this.newEditUsers = structuredClone(this.doc.edit_users) ?? [];
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
    this.collabDocsService.updateDocAccess(
      this.user!.access_token!,
      this.doc!.projectId,
      this.doc!._id,
      this.newViewRoles,
      this.newViewUsers,
      this.newEditRoles,
      this.newEditUsers
    ).subscribe({
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

  onViewRoleChange(event: any) {
    if (event.target.checked) {
      this.newViewRoles.push(event.target.value);
    }
    else {
      this.newViewRoles = this.newViewRoles.filter(e => e !== event.target.value);
    }
  }

  onViewUserChange(event: any) {
    if (event.target.checked) {
      this.newViewUsers.push(event.target.value);
    }
    else {
      this.newViewUsers = this.newViewUsers.filter(e => e !== event.target.value);
    }
  }

  onEditRoleChange(event: any) {
    if (event.target.checked) {
      this.newEditRoles.push(event.target.value);
    }
    else {
      this.newEditRoles = this.newEditRoles.filter(e => e !== event.target.value);
    }
  }

  onEditUserChange(event: any) {
    if (event.target.checked) {
      this.newEditUsers.push(event.target.value);
    }
    else {
      this.newEditUsers = this.newEditUsers.filter(e => e !== event.target.value);
    }
  }
}
