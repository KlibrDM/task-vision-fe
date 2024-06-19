import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IProject, OwnerTypes, ProjectRole } from 'src/app/models/project';
import moment from 'moment';
import markdownit from 'markdown-it';
import { addIcons } from 'ionicons';
import {
  paperPlaneOutline,
  closeOutline,
  expandOutline,
  cloudDownloadOutline,
  trashOutline,
  filmOutline,
  sparklesOutline,
  addCircleOutline,
} from 'ionicons/icons';
import { AlertController, ToastController } from '@ionic/angular/standalone';
import { IItem, IItemRelation, ItemPriority, ItemRelationType, ItemResolution, ItemType } from 'src/app/models/item';
import { IUser, IUserPartner } from 'src/app/models/user';
import { ISprint } from 'src/app/models/sprint';
import { ItemService } from 'src/app/services/item.service';
import * as Constants from 'src/app/models/constants';
import { RouterModule } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { LogsControllerComponent } from '../logs-controller/logs-controller.component';
import { HourActivityComponent } from '../hour-activity/hour-activity.component';
import { IUploadedDoc } from 'src/app/models/uploadedDocs';
import { DocsService } from 'src/app/services/docs.service';
import { ImageViewerModalComponent } from '../image-viewer-modal/image-viewer-modal.component';
import { VideoViewerModalComponent } from '../video-viewer-modal/video-viewer-modal.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-item-details-content',
  templateUrl: './item-details-content.component.html',
  styleUrls: ['./item-details-content.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    ReactiveFormsModule,
    RouterModule,
    LogsControllerComponent,
    HourActivityComponent,
    ImageViewerModalComponent,
    VideoViewerModalComponent,
    MatTooltipModule,
  ]
})
export class ItemDetailsContentComponent implements OnInit, OnChanges, OnDestroy {
  @Output() itemChanged = new EventEmitter<IItem>();
  @Output() itemDeleted = new EventEmitter<void>();
  @Output() pageLeave = new EventEmitter<void>();
  @Input() allowEdit = false;
  @Input() item?: IItem;
  @Input() items?: IItem[];
  @Input() user?: IUser;
  @Input() project?: IProject;
  @Input() userType = OwnerTypes.USER;
  @Input() assignees: IUserPartner[] = [];
  @Input() epics: IItem[] = [];
  @Input() selfFilteredEpics: IItem[] = [];
  @Input() sprints: ISprint[] = [];

  @Input() allowEditClicked?: Observable<void>;
  @Input() discardClicked?: Observable<void>;
  @Input() saveClicked?: Observable<void>;

  md = markdownit({
    linkify: true,
  });
  moment = moment;
  Constants = Constants;
  languages = Constants.Languages;
  itemTypesEnum = ItemType;
  itemTypes = Object.values(ItemType);
  itemPriorities = Object.values(ItemPriority);
  itemResolutions = Object.values(ItemResolution);
  itemRelations = Object.values(ItemRelationType);

  seeRawDescription = true;
  descriptionMD: string = '';
  requirements: string = '';
  requirementsMD: string = '';
  labels: string[] = [];
  labelInput = '';
  columns: string[] = [];
  hoursLogged?: number;
  newComment = '';
  aiLanguage = 'en';

  defaultRelation: IItemRelation = {
    type: ItemRelationType.RELATES_TO,
    itemId: '',
  }
  newRelation?: IItemRelation;
  newRelationItemName = '';
  newRelationSearch = '';
  relationSearchResults: IItem[] = [];

  selectedViewSegment = 'comments';
  isAISummaryGenerating = false;

  itemAttachments: (IUploadedDoc & { blobUrl?: string })[] = [];
  expandedAttachment?: IUploadedDoc & { blobUrl?: string };
  selectedFiles: File[] = [];

  isImageExpanded = false;
  isVideoExpanded = false;
  @ViewChild('fileInput') fileInput?: ElementRef;

  originalItem = structuredClone(this.item);

  constructor(
    private itemService: ItemService,
    private toastController: ToastController,
    private translate: TranslateService,
    private alertController: AlertController,
    private docsService: DocsService,
  ) {
    addIcons({
      closeOutline,
      paperPlaneOutline,
      expandOutline,
      cloudDownloadOutline,
      trashOutline,
      filmOutline,
      sparklesOutline,
      addCircleOutline,
    });
  }

  ngOnInit() {
    this.aiLanguage = this.translate.currentLang;

    // Use structured clone to remove references
    this.item = structuredClone(this.item);
    this.items = structuredClone(this.items);

    if (this.allowEditClicked) {
      this.allowEditClicked.subscribe(() => this.onAllowEditClick());
    }
    if (this.discardClicked) {
      this.discardClicked.subscribe(() => this.onDiscardChangesClick());
    }
    if (this.saveClicked) {
      this.saveClicked.subscribe(() => this.onSaveChangesClick());
    }
  }

  ngOnDestroy() {
    this.itemAttachments.forEach(doc => {
      if (doc.blobUrl) {
        window.URL.revokeObjectURL(doc.blobUrl);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['item'] && changes['item'].currentValue) {
      const item: IItem = changes['item'].currentValue;
      this.labelInput = item.labels?.toString().replace(/,/g, ', ') ?? '';
      this.processLabelInput(this.labelInput);

      this.getItemAttachments();

      this.newRelationCancel();

      this.getDescriptionMD();

      if (this.project?.settings?.auto_show_linked_requirements) {
        this.getRequirementsMD();
      }
    }

    if (changes['project'] && changes['project'].currentValue) {
      const project: IProject = changes['project'].currentValue;
      this.columns = project.board_columns;
    }

    // Filter deleted sprints, epics and assignees
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
      this.selfFilteredEpics = this.epics.filter(e => e._id !== this.item?._id);
    }
  }

  onAllowEditClick() {
    this.originalItem = structuredClone(this.item);
  }

  onDiscardChangesClick() {
    this.item = structuredClone(this.originalItem);
    this.getDescriptionMD();

    // Reset labels
    this.labelInput = this.item?.labels?.toString().replace(/,/g, ', ') ?? '';
    this.processLabelInput(this.labelInput);
  }

  onSaveChangesClick() {
    if (this.item?.assigneeId === '[UNASSIGNED]') {
      this.item.assigneeId = undefined;
    }

    if (this.item?.epicId === '[UNASSIGNED]') {
      this.item.epicId = undefined;
    }

    if (this.item?.sprintId as unknown === '[UNASSIGNED]') {
      this.item!.sprintId = undefined;
    }

    if (typeof this.item?.sprintId === 'string') {
      this.item!.sprintId = [this.item.sprintId];
    }

    if (this.item?.resolution as unknown === '[UNASSIGNED]') {
      this.item!.resolution = undefined;
    }

    if (this.item?.ai_summary === '') {
      this.item!.ai_summary = undefined;
    }

    if (this.item?.complexity === null) {
      this.item!.complexity = undefined;
    }

    if (this.item?.estimate === null) {
      this.item!.estimate = undefined;
      this.item!.hours_left = undefined;
    }

    this.itemService.updateItem(this.user!.access_token!, this.project!._id, this.item!._id, this.item!).subscribe({
      next: (item) => {
        this.item = item;
        this.itemChanged.emit(item);

        this.getDescriptionMD();

        this.toastController.create({
          message: this.translate.instant('ITEM_SUCCESSFULLY_UPDATED'),
          duration: 4000,
          color: 'success'
        }).then((toast) => toast.present());
      },
      error: () => {
        // Revert to original item
        this.item = structuredClone(this.originalItem);
        this.getDescriptionMD();

        this.toastController.create({
          message: this.translate.instant('ITEM_UPDATE_FAILED'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      }
    });
  }

  processLabelInput(input: string) {
    this.labels = input.split(',').filter(e => e.trim().length).map(e => e.trim());
    this.item!.labels = this.labels;
  }

  getUserNameAtId(id?: string) {
    if (!id) {
      return this.translate.instant('UNASSIGNED');
    }
    const user = this.assignees.find(e => e._id === id);
    return user ? user.first_name + ' ' + user.last_name : this.translate.instant('UNASSIGNED');
  }

  getEpicNameAtId(id?: string) {
    if (!id) {
      return this.translate.instant('NOT_LINKED');
    }
    const epic = this.epics.find(e => e._id === id);
    return epic ? epic.name : this.translate.instant('NOT_LINKED');
  }

  getSprintNameAtId(id?: string[]) {
    if (!id) {
      return this.translate.instant('BACKLOG');
    }
    const sprints = this.sprints.filter(e => id.includes(e._id));
    return sprints ? sprints.map(s => s.name).join(', ') : this.translate.instant('BACKLOG');
  }

  getItemNameAtId(id: string) {
    const item = this.items?.find(e => e._id === id);
    return item
      ? item.code + ' - ' + item.name + (item.deleted ? ` (${this.translate.instant('DELETED')})` : '')
      : this.translate.instant('NOT_FOUND');
  }

  // Implements project rule: auto_show_linked_requirements
  getRequirementsMD() {
    if (!this.item?.relations) {
      this.requirements = '';
      return;
    }

    const relatedItemIds = this.item.relations.map(e => e.itemId);
    const requirements = this.items?.filter(e =>
      relatedItemIds.includes(e._id)
      && (
        e.type === ItemType.CUSTOMER_REQUIREMENT
        || e.type === ItemType.FUNCTIONAL_REQUIREMENT
        || e.type === ItemType.NON_FUNCTIONAL_REQUIREMENT
      )
    );

    if (!requirements) {
      this.requirements = '';
      return;
    }

    this.requirements = requirements.map((e,i) => `${e.code} - ${e.name}\n\n${e.description}${i !== requirements.length - 1 ? '\n\n\n' : ''}`).join('');
    this.requirementsMD = this.md.render(this.requirements);
  }

  getDescriptionMD() {
    this.descriptionMD = this.md.render(this.item?.description || '');
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

  onLogHoursClick() {
    if (this.hoursLogged === undefined) {
      return;
    }

    if (this.hoursLogged <= 0) {
      this.toastController.create({
        message: this.translate.instant('INVALID_HOURS'),
        duration: 4000,
        color: 'danger'
      }).then((toast) => toast.present());
      return;
    }

    this.itemService.logHours(this.user!.access_token!, this.project!._id, this.item!._id, this.hoursLogged).subscribe({
      next: (item) => {
        this.itemChanged.emit(item);
        this.item = item;
        this.hoursLogged = undefined;

        this.toastController.create({
          message: this.translate.instant('ACTIVITY_LOGGING_SUCCESSFUL'),
          duration: 4000,
          color: 'success'
        }).then((toast) => toast.present());
      },
      error: () => {
        this.toastController.create({
          message: this.translate.instant('ACTIVITY_LOGGING_FAILED'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      }
    });
  }

  onAddCommentClick() {
    if (this.newComment === '') {
      return;
    }

    this.itemService.addComment(this.user!.access_token!, this.project!._id, this.item!._id, this.newComment).subscribe({
      next: (item) => {
        this.itemChanged.emit(item);
        this.item = item;
        this.newComment = '';

        this.toastController.create({
          message: this.translate.instant('COMMENT_SUCCESSFULLY_ADDED'),
          duration: 4000,
          color: 'success'
        }).then((toast) => toast.present());
      },
      error: () => {
        this.toastController.create({
          message: this.translate.instant('COULDNT_ADD_COMMENT'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      }
    });
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
      e._id !== this.item!._id
      && !e.deleted
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

  onSaveRelationClick() {
    if (!this.newRelation?.itemId) {
      return;
    }

    this.itemService.addRelation(this.user!.access_token!, this.project!._id, this.item!._id, this.newRelation!).subscribe({
      next: (item) => {
        this.itemChanged.emit(item);
        this.item = item;
        this.newRelationCancel();

        if (this.project?.settings?.auto_show_linked_requirements) {
          this.getRequirementsMD();
        }

        this.toastController.create({
          message: this.translate.instant('RELATION_SUCCESSFULLY_CREATED'),
          duration: 4000,
          color: 'success'
        }).then((toast) => toast.present());
      },
      error: () => {
        this.toastController.create({
          message: this.translate.instant('COULDNT_CREATE_RELATION'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      }
    });
  }

  async onDeleteRelationClick(relation: IItemRelation) {
    const alert = await this.alertController.create({
      header: this.translate.instant('DELETE_RELATION'),
      message: this.translate.instant('DELETE_RELATION_CONFIRMATION', {
        relation: this.translate.instant(relation.type),
        itemName: this.getItemNameAtId(relation.itemId)
      }),
      buttons: [
        {
          text: this.translate.instant('CANCEL'),
          role: 'cancel',
          cssClass: 'secondary'
        }, {
          text: this.translate.instant('DELETE'),
          handler: () => this.deleteRelation(relation)
        }
      ]
    });
    await alert.present();
  }

  deleteRelation(relation: IItemRelation) {
    this.itemService.deleteRelation(this.user!.access_token!, this.project!._id, this.item!._id, relation).subscribe({
      next: (item) => {
        this.itemChanged.emit(item);
        this.item = item;

        if (this.project?.settings?.auto_show_linked_requirements) {
          this.getRequirementsMD();
        }

        this.toastController.create({
          message: this.translate.instant('RELATION_SUCCESSFULLY_DELETED'),
          duration: 4000,
          color: 'success'
        }).then((toast) => toast.present());
      },
      error: () => {
        this.toastController.create({
          message: this.translate.instant('COULDNT_DELETE_RELATION'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      }
    });
  }

  async onDeleteItemClick() {
    const alert = await this.alertController.create({
      header: this.translate.instant('DELETE_ITEM'),
      message: this.translate.instant('DELETE_ITEM_CONFIRMATION'),
      buttons: [
        {
          text: this.translate.instant('CANCEL'),
          role: 'cancel',
          cssClass: 'secondary'
        }, {
          text: this.translate.instant('DELETE'),
          handler: () => this.deleteItem()
        }
      ]
    });
    await alert.present();
  }

  deleteItem() {
    this.itemService.deleteItem(this.user!.access_token!, this.project!._id, this.item!._id).subscribe({
      next: (item) => {
        this.itemChanged.emit(item);
        this.itemDeleted.emit();
        this.item = item;

        this.toastController.create({
          message: this.translate.instant('ITEM_SUCCESSFULLY_DELETED'),
          duration: 4000,
          color: 'success'
        }).then((toast) => toast.present());
      },
      error: () => {
        this.toastController.create({
          message: this.translate.instant('COULDNT_DELETE_ITEM'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      }
    });
  }

  generateIdList() {
    const idList: {id: string, name: string}[] = [
      ...this.items!.map(e => ({id: e._id, name: e.code + ' - ' + e.name})) ?? [],
      ...this.sprints.map(e => ({id: e._id, name: e.name})),
      ...this.assignees.map(e => ({id: e._id, name: e.first_name + ' ' + e.last_name})),
    ]
    return idList;
  }

  onSelectedViewChange(event: any) {
    this.selectedViewSegment = event.detail.value;
  }

  onGenerateAISummary() {
    if (!this.item?.name || !this.item?.description) {
      return;
    }

    const fullLanguageName = this.languages.find(e => e.code === this.aiLanguage)?.english_name || this.aiLanguage;

    this.isAISummaryGenerating = true;

    this.itemService.getItemAISummary(this.user!.access_token!, {
      name: this.item.name,
      description: this.item.description,
      type: this.item.type,
      language: fullLanguageName,
      epicId: this.item.epicId?.length ? this.item.epicId : undefined
    }).subscribe({
      next: (res) => {
        this.item!.ai_summary = res.summary;
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

  isCurrentUserReporter() {
    return this.item?.reporterId === this.user?._id;
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

  onFileUploadClick() {
    if (this.selectedFiles.length > 0) {
      const formData = new FormData();
      for (let i = 0; i < this.selectedFiles.length; i++) {
        formData.append('files', this.selectedFiles[i], this.selectedFiles[i].name);
      }
      this.docsService.uploadItemAttachments(this.user?.access_token || '', this.project!._id, this.item!._id, formData).subscribe({
        next: () => {
          this.getItemAttachments();
          this.selectedFiles = [];
          this.toastController.create({
            message: this.translate.instant('ATTACHMENTS_UPLOADED_SUCCESSFULLY'),
            duration: 4000,
            color: 'success'
          }).then((toast) => toast.present());
        },
        error: () => {
          this.toastController.create({
            message: this.translate.instant('COULDNT_UPLOAD_ATTACHMENTS'),
            duration: 4000,
            color: 'danger'
          }).then((toast) => toast.present());
        },
      });
    }
  }

  getItemAttachments() {
    this.docsService.getItemAttachments(this.user!.access_token!, this.project!._id, this.item!._id).subscribe({
      next: (docs) => {
        this.itemAttachments = docs;
        this.itemAttachments.forEach(doc => {
          if (Constants.FileTypesImages.includes(doc.type)) {
            this.docsService.viewDoc(this.project!._id, doc._id, doc.name).subscribe({
              next: (blob) => {
                doc.blobUrl = URL.createObjectURL(blob);
              },
              error: () => {
                this.toastController.create({
                  message: this.translate.instant('COULDNT_DOWNLOAD_ATTACHMENT'),
                  duration: 4000,
                  color: 'danger'
                }).then((toast) => toast.present());
              }
            });
          }
        });
      },
      error: () => {
        this.toastController.create({
          message: this.translate.instant('COULDNT_GET_ATTACHMENTS'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      }
    });
  }

  async onExpandAttachmentClick(doc: IUploadedDoc, blobUrl?: string) {
    if (Constants.FileTypesImages.includes(doc.type)) {
      this.isImageExpanded = true;
    }
    else if (Constants.FileTypesVideos.includes(doc.type)) {
      this.isVideoExpanded = true;
    }
    else {
      return;
    }

    if (!blobUrl) {
      const blob = await firstValueFrom(
        this.docsService.downloadDoc(this.user?.access_token!, this.project?._id!, doc._id)
      ).catch(() => {
        this.toastController.create({
          message: this.translate.instant('COULDNT_DOWNLOAD_ATTACHMENT'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      });

      if (blob) {
        blobUrl = URL.createObjectURL(blob);
      }
    }
    this.expandedAttachment = {
      ...doc,
      blobUrl,
    };
  }

  onCloseImageVideoViewer() {
    if (this.expandedAttachment?.blobUrl && !Constants.FileTypesImages.includes(this.expandedAttachment.type)) {
      window.URL.revokeObjectURL(this.expandedAttachment.blobUrl);
    }

    this.expandedAttachment = undefined;
    this.isImageExpanded = false;
    this.isVideoExpanded = false;
  }

  onDownloadAttachmentClick(doc: IUploadedDoc, url?: string) {
    if (!url) {
      return;
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = doc.name;
    link.click();
  }

  onAddToDescriptionAttachmentClick(doc: IUploadedDoc, url?: string) {
    if (!url || !this.allowEdit)  {
      return;
    }

    const markdown = `\n\n![${doc.name}](${environment.api}/doc/view/${this.project!._id}/${doc._id}/${encodeURI(doc.name)})`;
    this.item!.description += markdown;
    this.getDescriptionMD();
  }

  async onDeleteAttachmentClick(doc: IUploadedDoc) {
    const alert = await this.alertController.create({
      header: this.translate.instant('DELETE_FILE'),
      message: this.translate.instant('DELETE_FILE_CONFIRMATION'),
      buttons: [
        {
          text: this.translate.instant('CANCEL'),
          role: 'cancel',
          cssClass: 'secondary'
        }, {
          text: this.translate.instant('DELETE'),
          handler: () => this.deleteAttachment(doc._id)
        }
      ]
    });
    await alert.present();
  }

  deleteAttachment(docId: string) {
    this.docsService.deleteDoc(this.user?.access_token!, this.project?._id!, docId).subscribe({
      next: () => {
        this.itemAttachments = this.itemAttachments.filter(e => e._id !== docId);
        this.toastController.create({
          message: this.translate.instant('FILE_SUCCESSFULLY_DELETED'),
          duration: 4000,
          color: 'success'
        }).then((toast) => toast.present());
      },
      error: () => {
        this.toastController.create({
          message: this.translate.instant('ERROR_WHILE_DELETING_FILE'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      }
    });
  }

  canDeleteComment(commentAuthorId: string) {
    if (commentAuthorId === this.user?._id) {
      return true;
    }
    const userRole = this.assignees.find(e => e._id === this.user?._id)?.role;
    if (!userRole) {
      return false;
    }
    else {
      return userRole === ProjectRole.OWNER || userRole === ProjectRole.ADMIN || userRole === ProjectRole.BOARDMASTER;
    }
  }

  async onDeleteCommentClick(commentId?: string) {
    if (!commentId) {
      return;
    }

    const alert = await this.alertController.create({
      header: this.translate.instant('DELETE_COMMENT'),
      message: this.translate.instant('DELETE_COMMENT_CONFIRMATION'),
      buttons: [
        {
          text: this.translate.instant('CANCEL'),
          role: 'cancel',
          cssClass: 'secondary',
        }, {
          text: this.translate.instant('DELETE'),
          handler: () => this.deleteComment(commentId)
        }
      ]
    });
    await alert.present();
  }

  deleteComment(commentId: string) {
    this.itemService.deleteComment(this.user?.access_token!, this.project?._id!, this.item?._id!, commentId).subscribe({
      next: () => {
        this.item!.comments = this.item!.comments?.filter(e => e._id !== commentId);
        this.toastController.create({
          message: this.translate.instant('COMMENT_SUCCESSFULLY_DELETED'),
          duration: 4000,
          color: 'success'
        }).then((toast) => toast.present());
      },
      error: () => {
        this.toastController.create({
          message: this.translate.instant('ERROR_WHILE_DELETING_COMMENT'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    // Change segment if going from mobile size to desktop and details is selected
    if (this.selectedViewSegment === 'details' && event.target.innerWidth >= 768) {
      this.selectedViewSegment = 'comments';
    }
  }
}
