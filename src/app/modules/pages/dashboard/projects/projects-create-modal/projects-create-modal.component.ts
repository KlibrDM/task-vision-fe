import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IProjectPayload, OwnerTypes } from 'src/app/models/project';
import moment from 'moment';
import { addIcons } from 'ionicons';
import {
  addCircleOutline,
  closeOutline,
  flaskOutline,
  checkmarkOutline,
  banOutline,
  removeOutline
} from 'ionicons/icons';
import { ToastController } from '@ionic/angular/standalone';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-projects-create-modal',
  templateUrl: './projects-create-modal.component.html',
  styleUrls: ['./projects-create-modal.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    ReactiveFormsModule,
    MatTooltipModule
  ]
})
export class ProjectsCreateModalComponent {
  @Output() closeModal = new EventEmitter<void>();
  @Output() confirmModal = new EventEmitter<IProjectPayload>();
  @Input() isOpen = false;
  @Input() userType = OwnerTypes.USER;

  name = '';
  code = '';
  description = '';
  board_columns = ['To Do', 'In Progress', 'Done'];
  qaColumn?: string;
  blockedColumn?: string;
  doneColumn?: string = 'Done'; 
  use_sprints = true;
  sprint_length: number | string = 14;
  custom_sprint_length = 14;
  start_date = moment().format('YYYY-MM-DD');
  end_date = moment().add(6, 'months').format('YYYY-MM-DD');

  constructor(
    private toastController: ToastController,
    private translate: TranslateService
  ) {
    addIcons({
      closeOutline,
      addCircleOutline,
      flaskOutline,
      checkmarkOutline,
      banOutline,
      removeOutline
    });
  }

  cancel() {
    this.closeModal.emit();
  }

  confirm() {
    if (this.name === '' || this.code === '') {
      this.toastController.create({
        message: this.translate.instant('ALL_FIELDS_REQUIRED'),
        duration: 4000,
        color: 'danger'
      }).then((toast) => toast.present());
      return;
    }

    if (this.name === '$collab') {
      this.toastController.create({
        message: this.translate.instant('ILLEGAL_PROJECT_NAME'),
        duration: 4000,
        color: 'danger'
      }).then((toast) => toast.present());
      return;
    }

    if (this.board_columns.length === 0) {
      this.toastController.create({
        message: this.translate.instant('MUST_HAVE_AT_LEAST_ONE_COLUMN'),
        duration: 4000,
        color: 'danger'
      }).then((toast) => toast.present());
      return;
    }

    if (moment(this.start_date).isAfter(this.end_date)) {
      this.toastController.create({
        message: this.translate.instant('START_BEFORE_END'),
        duration: 4000,
        color: 'danger'
      }).then((toast) => toast.present());
      return;
    }

    const project: IProjectPayload = {
      name: this.name,
      code: this.code,
      description: this.description,
      owner_type: this.userType,
      board_columns: this.board_columns,
      qa_column: this.qaColumn,
      blocked_column: this.blockedColumn,
      done_column: this.doneColumn,
      settings: {
        use_sprints: this.use_sprints,
        sprint_length: typeof this.sprint_length === 'string'
          ? this.custom_sprint_length
          : this.sprint_length,
        force_epic_link: false,
        auto_show_linked_requirements: true,
        enable_multi_sprint_items: true,
        enable_hour_tracking: true,
        enable_reactivity: true,
        auto_move_to_qa: false
      },
      start_date: moment(this.start_date).toDate(),
      end_date: moment(this.end_date).toDate()
    };
    this.confirmModal.emit(project);

    // Reset form
    this.name = '';
    this.code = '';
    this.description = '';
    this.board_columns = ['To Do', 'In Progress', 'Done'];
    this.qaColumn = undefined;
    this.blockedColumn = undefined;
    this.doneColumn = 'Done';
    this.use_sprints = true;
    this.sprint_length = 14;
    this.custom_sprint_length = 14;
    this.start_date = moment().format('YYYY-MM-DD');
    this.end_date = moment().add(6, 'months').format('YYYY-MM-DD');
  }

  setAsQAColumn(index: number) {
    this.qaColumn = this.board_columns[index];
  }

  setAsBlockedColumn(index: number) {
    this.blockedColumn = this.board_columns[index];
  }

  setAsDoneColumn(index: number) {
    this.doneColumn = this.board_columns[index];
  }

  removeColumnType(index: number) {
    if (this.qaColumn === this.board_columns[index]) {
      this.qaColumn = undefined;
    }
    if (this.blockedColumn === this.board_columns[index]) {
      this.blockedColumn = undefined;
    }
    if (this.doneColumn === this.board_columns[index]) {
      this.doneColumn = undefined;
    }
  }

  addColumn() {
    this.board_columns.push('');
  }

  removeColumn(index: number) {
    if (this.board_columns.length === 1) {
      this.toastController.create({
        message: this.translate.instant('MUST_HAVE_AT_LEAST_ONE_COLUMN'),
        duration: 4000,
        color: 'danger'
      }).then((toast) => toast.present());
      return;
    }
    this.removeColumnType(index);
    this.board_columns.splice(index, 1);
  }

  trackByFn(index: any) {
    return index;
  }
}
