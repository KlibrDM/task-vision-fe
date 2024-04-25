import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import moment from 'moment';
import { addIcons } from 'ionicons';
import { addCircleOutline, closeOutline } from 'ionicons/icons';
import { ToastController } from '@ionic/angular/standalone';
import { ISprintPayload, SprintType } from 'src/app/models/sprint';

@Component({
  selector: 'app-sprint-create-modal',
  templateUrl: './sprint-create-modal.component.html',
  styleUrls: ['./sprint-create-modal.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    ReactiveFormsModule
  ]
})
export class SprintCreateModalComponent implements OnChanges {
  @Output() closeModal = new EventEmitter<void>();
  @Output() confirmModal = new EventEmitter<ISprintPayload>();
  @Input() isOpen = false;
  @Input() projectId = '';
  @Input() sprintLength = 14;

  name = '';
  description = '';
  start_date = moment().format('YYYY-MM-DD');
  end_date = moment().add(14, 'days').format('YYYY-MM-DD');

  constructor(
    private toastController: ToastController,
    private translate: TranslateService
  ) {
    addIcons({ addCircleOutline, closeOutline });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['sprintLength'] && changes['sprintLength'].currentValue) {
      this.end_date = moment(this.start_date).add(this.sprintLength, 'days').format('YYYY-MM-DD');
    }
  }

  cancel() {
    this.closeModal.emit();
  }

  confirm() {
    if (!this.projectId) {
      this.toastController.create({
        message: this.translate.instant('PROJECT_ID_NOT_PROVIDED'),
        duration: 4000,
        color: 'danger'
      }).then((toast) => toast.present());
      return;
    }

    if (!this.name || !this.start_date || !this.end_date) {
      this.toastController.create({
        message: this.translate.instant('FILL_REQUIRED_FIELDS'),
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

    const sprint: ISprintPayload = {
      projectId: this.projectId,
      name: this.name,
      description: this.description,
      type: SprintType.SPRINT,
      start_date: moment(this.start_date).toDate(),
      end_date: moment(this.end_date).toDate()
    };
    this.confirmModal.emit(sprint);
  }
}
