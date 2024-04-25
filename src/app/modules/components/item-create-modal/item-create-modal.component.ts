import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import markdownit from 'markdown-it';
import { IProject } from 'src/app/models/project';
import { addIcons } from 'ionicons';
import { addCircleOutline, closeOutline, sparklesOutline } from 'ionicons/icons';
import { ToastController } from '@ionic/angular/standalone';
import { IItem, IItemPayload, IItemRelation, ItemPriority, ItemRelationType, ItemType } from 'src/app/models/item';
import { IUser, IUserPartner } from 'src/app/models/user';
import { ISprint } from 'src/app/models/sprint';
import { ItemPropertyIconComponent } from '../item-property-icon/item-property-icon.component';
import { ItemService } from 'src/app/services/item.service';
import moment from 'moment';

@Component({
  selector: 'app-item-create-modal',
  templateUrl: './item-create-modal.component.html',
  styleUrls: ['./item-create-modal.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    ReactiveFormsModule,
    ItemPropertyIconComponent
  ]
})
export class ItemCreateModalComponent implements OnChanges {
  @Output() closeModal = new EventEmitter<void>();
  @Output() confirmModal = new EventEmitter<{
    item: IItemPayload,
    files: File[],
  }>();
  @Input() isOpen = false;
  @Input() user?: IUser;
  @Input() items?: IItem[];
  @Input() project?: IProject;
  @Input() assignees: IUserPartner[] = [];
  @Input() epics: IItem[] = [];
  @Input() sprints: ISprint[] = [];

  md = markdownit({
    linkify: true,
  });
  itemTypesEnum = ItemType;
  itemTypes = Object.values(ItemType);
  itemPriorities = Object.values(ItemPriority);
  itemRelations = Object.values(ItemRelationType);

  type = ItemType.TASK;
  name = '';
  description = '';
  aiSummary = '';
  complexity?: number;
  estimate?: number;
  priority = ItemPriority.MEDIUM;
  assigneeId = '';
  epicId = '';
  sprintId: string | string[] = '';
  labels: string[] = [];
  labelInput = '';

  relations: IItemRelation[] = [];
  defaultRelation: IItemRelation = {
    type: ItemRelationType.RELATES_TO,
    itemId: '',
  }
  newRelation?: IItemRelation;
  newRelationItemName = '';
  newRelationSearch = '';
  relationSearchResults: IItem[] = [];

  isAISummaryGenerating = false;
  seeRawDescription = true;
  descriptionMD: string = '';
  selectedFiles: File[] = [];

  @ViewChild('fileInput') fileInput?: ElementRef;

  constructor(
    private toastController: ToastController,
    private translate: TranslateService,
    private itemService: ItemService,
  ) {
    addIcons({ addCircleOutline, closeOutline, sparklesOutline });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['sprints'] && changes['sprints'].currentValue) {
      this.sprints = this.sprints
        .filter(e => !e.deleted)
        .sort((a,b) => moment(a.start_date).isBefore(b.start_date) ? 1 : -1)
        .map(e => ({
          ...e,
          name: e.name + (e.is_completed ? ` (${this.translate.instant('COMPLETED')})` : '')
        }));
    }
    if (changes['epics'] && changes['epics'].currentValue) {
      this.epics = this.epics.filter(e => !e.deleted);
    }
  }

  cancel() {
    this.closeModal.emit();
  }

  confirm() {
    if (this.name === '') {
      this.toastController.create({
        message: this.translate.instant('FILL_REQUIRED_FIELDS'),
        duration: 4000,
        color: 'danger'
      }).then((toast) => toast.present());
      return;
    }

    if (!this.project || !this.user) {
      this.toastController.create({
        message: this.translate.instant('ERROR_WHILE_CREATING_ITEM'),
        duration: 4000,
        color: 'danger'
      }).then((toast) => toast.present());
      return;
    }

    if (this.assigneeId === '[UNASSIGNED]') {
      this.assigneeId = '';
    }

    if (this.epicId === '[UNASSIGNED]' || this.epicId === '') {
      this.epicId = '';
    }

    if (this.sprintId === '[UNASSIGNED]') {
      this.sprintId = '';
    }

    // Implement project rule: force epic link
    if (this.project.settings.force_epic_link && this.epicId === '' && this.type !== this.itemTypesEnum.EPIC) {
      if (this.project.settings.force_epic_link) {
        this.toastController.create({
          message: this.translate.instant('ITEM_MUST_BE_LINKED_TO_AN_EPIC'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
        return;
      }
    }

    const item: IItemPayload = {
      projectId: this.project._id,
      sprintId: this.sprintId.length
        ? Array.isArray(this.sprintId)
          ? this.sprintId
          : [this.sprintId]
        : undefined,
      column: this.project.board_columns[0],
      name: this.name,
      description: this.description,
      ai_summary: this.aiSummary.length ? this.aiSummary : undefined,
      type: this.type,
      reporterId: this.user._id,
      assigneeId: this.assigneeId.length ? this.assigneeId : undefined,
      complexity: this.complexity ? this.complexity : undefined,
      estimate: this.estimate ? this.estimate : undefined,
      priority: this.priority,
      labels: this.labels.length ? this.labels : undefined,
      epicId: this.epicId.length && this.type !== this.itemTypesEnum.EPIC ? this.epicId : undefined,
      relations: this.relations.length ? this.relations : undefined
    };

    this.confirmModal.emit({
      item,
      files: this.selectedFiles,
    });

    this.reset();
  }

  reset() {
    this.type = ItemType.TASK;
    this.name = '';
    this.description = '';
    this.aiSummary = '';
    this.complexity = undefined;
    this.estimate = undefined;
    this.priority = ItemPriority.MEDIUM;
    this.assigneeId = '';
    this.epicId = '';
    this.sprintId = '';
    this.labels = [];
    this.labelInput = '';
    this.relations = [];
    this.selectedFiles = [];
  }

  processLabelInput(input: string) {
    this.labels = input.split(',').filter(e => e.trim().length).map(e => e.trim());
  }

  getItemNameAtId(id: string) {
    const item = this.items?.find(e => e._id === id);
    return item
      ? item.code + ' - ' + item.name + (item.deleted ? ` (${this.translate.instant('DELETED')})` : '')
      : this.translate.instant('NOT_FOUND');
  }

  getDescriptionMD() {
    this.descriptionMD = this.md.render(this.description || '');
  }

  setDescriptionView(view: 'raw' | 'md') {
    if (view === 'raw') {
      this.seeRawDescription = true;
    }
    else {
      this.getDescriptionMD();
      this.seeRawDescription = false;
    }
  }

  newRelationCancel() {
    this.newRelation = undefined;
    this.newRelationItemName = '';
    this.newRelationSearch = '';
    this.relationSearchResults = [];
  }

  onAddRelationClick() {
    this.newRelation = structuredClone(this.defaultRelation);
  }

  onCancelNewRelationClick() {
    this.newRelationCancel();
  }

  onNewRelationSearchChange() {
    if (!this.newRelationSearch) {
      this.relationSearchResults = [];
      return;
    }

    this.relationSearchResults = this.items!.filter(e =>
      !e.deleted
      && (
        e.name.toLowerCase().includes(this.newRelationSearch.toLowerCase())
        || e.code.toLowerCase().includes(this.newRelationSearch.toLowerCase())
      )
    );
  }

  onNewRelationSearchItemClick(item: IItem) {
    this.newRelation!.itemId = item._id;
    this.newRelationItemName = item.code + ' - ' + item.name;
    this.relationSearchResults = [];
  }

  onDeleteRelationClick(relation: IItemRelation) {
    this.relations = this.relations.filter(e => e.itemId !== relation.itemId);
  }

  onSaveRelationClick() {
    if (!this.newRelation || !this.newRelation.itemId) {
      return;
    }

    this.relations.push(this.newRelation);
    this.newRelationCancel();
  }

  onFileSelected(event: any) {
    const files: FileList = event?.target?.files;
    if (files.length === 0) {
      return;
    }

    for (let i = 0; i < files.length; i++) {
      this.selectedFiles.push(files[i]);
    }

    // Reset file input
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onFileRemoved(file: File) {
    this.selectedFiles = this.selectedFiles.filter(e => e !== file);
  }

  onGenerateAISummary() {
    if (!this.name || !this.description) {
      return;
    }

    this.isAISummaryGenerating = true;

    this.itemService.getItemAISummary(this.user!.access_token!, {
      name: this.name,
      description: this.description,
      type: this.type,
      epicId: this.epicId.length ? this.epicId : undefined
    }).subscribe({
      next: (res) => {
        this.aiSummary = res.summary;
        this.isAISummaryGenerating = false;
      },
      error: () => {
        this.toastController.create({
          message: this.translate.instant('ERROR_WHILE_GENERATING_AI_SUMMARY'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
        this.isAISummaryGenerating = false;
      }
    })
  }
}
