import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { IProject, OwnerTypes } from 'src/app/models/project';
import { IItem } from 'src/app/models/item';
import { IUser, IUserPartner } from 'src/app/models/user';
import { ISprint } from 'src/app/models/sprint';
import { RouterModule } from '@angular/router';
import { ItemDetailsContentComponent } from '../item-details-content/item-details-content.component';
import { Subject } from 'rxjs';
import { IonModal } from '@ionic/angular/common';

@Component({
  selector: 'app-item-details-modal',
  templateUrl: './item-details-modal.component.html',
  styleUrls: ['./item-details-modal.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    ReactiveFormsModule,
    RouterModule,
    ItemDetailsContentComponent
  ]
})
export class ItemDetailsModalComponent {
  @ViewChild('itemDetailsModal') modal?: IonModal;
  @Output() closeModal = new EventEmitter<void>();
  @Output() itemChanged = new EventEmitter<IItem>();
  @Input() isOpen = false;
  @Input() item?: IItem;
  @Input() items?: IItem[];
  @Input() user?: IUser;
  @Input() project?: IProject;
  @Input() userType = OwnerTypes.USER;
  @Input() assignees: IUserPartner[] = [];
  @Input() epics: IItem[] = [];
  @Input() sprints: ISprint[] = [];

  allowEdit = false;

  saveClicked = new Subject<void>();
  discardClicked = new Subject<void>();
  allowEditClicked = new Subject<void>();

  constructor() {}

  cancel() {
    this.closeModal.emit();
  }

  onAllowEditClick() {
    this.allowEdit = true;
    this.allowEditClicked.next();
  }

  onDiscardChangesClick() {
    this.allowEdit = false;
    this.discardClicked.next();
  }

  onSaveChangesClick() {
    this.allowEdit = false;
    this.saveClicked.next();
  }

  onItemChanged(item: IItem) {
    this.itemChanged.emit(item);
  }

  onPageLeave() {
    this.closeModal.emit();
    this.modal?.dismiss();
  }

  onItemDeleted() {
    this.allowEdit = false;
    this.closeModal.emit();
  }
}
