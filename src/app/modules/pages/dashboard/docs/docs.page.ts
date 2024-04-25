import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BoardNavbarComponent } from 'src/app/modules/components/board-navbar/board-navbar.component';
import { AuthService } from 'src/app/services/auth.service';
import { IUser, IUserPartner } from 'src/app/models/user';
import { IProject, ProjectRole } from 'src/app/models/project';
import { ProjectService } from 'src/app/services/project.service';
import {
  cloudUploadOutline,
  documentTextOutline,
  ellipsisVertical,
  downloadOutline,
  peopleOutline,
  trashOutline,
  folderOutline,
  imageOutline,
  arrowBackOutline,
  easelOutline,
  gridOutline,
  fileTrayStackedOutline,
  playOutline,
  filmOutline,
  musicalNoteOutline,
  documentOutline,
  eyeOutline
} from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { combineLatest } from 'rxjs';
import { DocsService } from 'src/app/services/docs.service';
import { AlertController, ToastController } from '@ionic/angular/standalone';
import { FileTypePipe } from 'src/app/pipes/fileType.pipe';
import { IUploadedDoc } from 'src/app/models/uploadedDocs';
import moment from 'moment';
import {
  FileTypesArchives,
  FileTypesAudios,
  FileTypesDocuments,
  FileTypesExecutables,
  FileTypesFolders,
  FileTypesImages,
  FileTypesPresentations,
  FileTypesSpreadsheets,
  FileTypesVideos
} from 'src/app/models/constants';
import { DocDetailsComponent } from './doc-details/doc-details.component';
import { DocAccessComponent } from './doc-access/doc-access.component';
import { WS_CLIENT_EVENTS } from 'src/app/models/ws';
import { SocketService } from 'src/app/services/socket.service';
import { ImageViewerModalComponent } from 'src/app/modules/components/image-viewer-modal/image-viewer-modal.component';
import { VideoViewerModalComponent } from 'src/app/modules/components/video-viewer-modal/video-viewer-modal.component';
import { ICollabDoc } from 'src/app/models/collabDocs';
import { CollabDocsService } from 'src/app/services/collabDocs.service';
import { PageDetailsComponent } from './page-details/page-details.component';
import { PageAccessComponent } from './page-access/page-access.component';

@Component({
  selector: 'app-docs',
  templateUrl: './docs.page.html',
  styleUrls: ['./docs.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    BoardNavbarComponent,
    FileTypePipe,
    DocDetailsComponent,
    DocAccessComponent,
    PageDetailsComponent,
    PageAccessComponent,
    ImageViewerModalComponent,
    VideoViewerModalComponent,
  ]
})
export class DocsPage {
  user?: IUser;
  project?: IProject;
  projectUsers?: IUserPartner[];
  uploadedDocs?: IUploadedDoc[] = [];
  collabDocs?: ICollabDoc[] = [];

  selectedSection: 'uploaded' | 'collab' = 'uploaded';

  path?: string | null;
  pathBreadcrumb: string[] = [];
  @ViewChild('fileInput') fileInput?: ElementRef;

  isDetailsOpen = false;
  isAccessOpen = false;
  detailsDoc?: IUploadedDoc;

  isCollabDetailsOpen = false;
  isCollabAccessOpen = false;
  collabDetailsDoc?: ICollabDoc;

  expandedDoc?: IUploadedDoc & { blobUrl?: string };
  isExpandedDocImage = false;
  isExpandedDocVideo = false;

  fileTypesDocuments = FileTypesDocuments;
  fileTypesPresentations = FileTypesPresentations;
  fileTypesSpreadsheets = FileTypesSpreadsheets;
  fileTypesArchives = FileTypesArchives;
  fileTypesExecutables = FileTypesExecutables;
  fileTypesImages = FileTypesImages;
  fileTypesVideos = FileTypesVideos;
  fileTypesAudios = FileTypesAudios;
  fileTypesFolders = FileTypesFolders;

  constructor(
    private router: Router,
    private toastController: ToastController,
    private translate: TranslateService,
    private authService: AuthService,
    private projectService: ProjectService,
    private docsService: DocsService,
    private collabDocsService: CollabDocsService,
    private alertController: AlertController,
    private location: Location,
    private socketService: SocketService,
  ) {
    addIcons({
      documentTextOutline,
      ellipsisVertical,
      cloudUploadOutline,
      downloadOutline,
      peopleOutline,
      trashOutline,
      folderOutline,
      imageOutline,
      arrowBackOutline,
      easelOutline,
      gridOutline,
      fileTrayStackedOutline,
      playOutline,
      filmOutline,
      musicalNoteOutline,
      documentOutline,
      eyeOutline,
    });
  }

  ionViewWillEnter() {
    combineLatest([
      this.authService.currentUser,
      this.projectService.getActiveProjectId()
    ]).subscribe(([user, id]) => {
      // Get folder structure path from route
      const fullPath = decodeURI(this.location.path());
      this.path = fullPath.substring(fullPath.indexOf('/app/docs/') + 10);
      if (this.path.endsWith('$collab')) {
        this.selectedSection = 'collab';
        this.path = '/';
      }
      if (this.path.startsWith('$collab/')) {
        this.selectedSection = 'collab';
        this.path = this.path.substring(8);
      }
      this.createPathBreadcrumb();

      if (!this.path?.length) {
        this.path = '/';
        this.createPathBreadcrumb();
      }

      if (!user) {
        this.router.navigate(['']);
        return;
      }
      this.user = user;

      if (!id) {
        this.router.navigate(['app/projects']);
        return;
      }
      this.projectService.setActiveProjectId(id);

      this.projectService.currentProject.subscribe((project) => {
        if (project) {
          this.project = project;
          this.projectService.getProjectUsers(this.user!.access_token!, this.project._id).subscribe((users) => {
            this.projectUsers = users;
          });
          if (this.selectedSection === 'uploaded') {
            this.getDocs(project._id);
          }
          else if (this.selectedSection === 'collab') {
            this.getCollabDocs(project._id);
          }
        }
        else {
          this.projectService.getProject(this.user!.access_token!, id).subscribe((project) => {
            this.project = project;
            this.projectService.getProjectUsers(this.user!.access_token!, this.project._id).subscribe((users) => {
              this.projectUsers = users;
            });
            this.projectService.setCurrentProject(project, this.user?._id!);
            if (this.selectedSection === 'uploaded') {
              this.getDocs(project._id);
            }
            else if (this.selectedSection === 'collab') {
              this.getCollabDocs(project._id);
            }
          });
        }
      });
    });

    this.socketService.serverMessage.subscribe((message) => {
      switch (message.event) {
        case WS_CLIENT_EVENTS.DOCS_CREATED:
          this.onWebSocketDocsCreate(message.payload as IUploadedDoc[]);
          break;
        case WS_CLIENT_EVENTS.DOC_CREATED:
          this.onWebSocketDocCreate(message.payload as IUploadedDoc);
          break;
        case WS_CLIENT_EVENTS.DOC_CHANGED:
          this.onWebSocketDocUpdate(message.payload as IUploadedDoc);
          break;
        case WS_CLIENT_EVENTS.DOC_DELETED:
          this.onWebSocketDocDelete(message.payload as IUploadedDoc);
          break;
        case WS_CLIENT_EVENTS.COLLAB_DOC_CREATED:
          this.onWebSocketCollabDocCreate(message.payload as ICollabDoc);
          break;
        case WS_CLIENT_EVENTS.COLLAB_DOC_CHANGED:
          this.onWebSocketCollabDocUpdate(message.payload as ICollabDoc);
          break;
        case WS_CLIENT_EVENTS.COLLAB_DOC_DELETED:
          this.onWebSocketCollabDocDelete(message.payload as ICollabDoc);
          break;
        default:
          break;
      }
    });
  }

  getDocs(projectId: string) {
    this.docsService.getUploadedDocs(this.user?.access_token!, projectId, this.path!).subscribe((docs) => {
      this.uploadedDocs = this.sortDocs(docs);
    });
  }

  getCollabDocs(projectId: string) {
    this.collabDocsService.getCollabDocs(this.user?.access_token!, projectId, this.path!).subscribe((docs) => {
      this.collabDocs = this.sortCollabDocs(docs);
    });
  }

  sortDocs(docs: IUploadedDoc[]) {
    return docs.sort((a,b) => {
      if (moment(a.createdAt).isBefore(b.createdAt)) {
        return -1;
      }
      if (moment(a.createdAt).isAfter(b.createdAt)) {
        return 1;
      }
      return 0;
    }).sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') {
        return -1;
      }
      if (a.type !== 'folder' && b.type === 'folder') {
        return 1;
      }
      return 0;
    });
  }

  sortCollabDocs(docs: ICollabDoc[]) {
    return docs.sort((a,b) => {
      if (moment(a.createdAt).isBefore(b.createdAt)) {
        return -1;
      }
      if (moment(a.createdAt).isAfter(b.createdAt)) {
        return 1;
      }
      return 0;
    }).sort((a, b) => {
      if (a.is_folder && !b.is_folder) {
        return -1;
      }
      if (!a.is_folder && b.is_folder) {
        return 1;
      }
      return 0;
    });
  }

  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    if (files.length === 0) {
      return;
    }

    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i], files[i].name);
    }

    // Reset file input
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }

    // If the path is the project folder followed by a slash, upload happens as item attachment
    if (this.path?.startsWith(`${this.project!.name}/`)) {
      const itemCode = this.path.substring(this.project!.name.length + 1);
      this.docsService.uploadItemAttachmentsByCode(this.user?.access_token!, this.project?._id!, itemCode, formData).subscribe({
        next: (docs) => {
          docs.forEach(doc => {
            this.uploadedDocs!.push(doc);
            this.uploadedDocs = this.sortDocs(this.uploadedDocs!);
          });
  
          this.toastController.create({
            message: this.translate.instant('FILES_SUCCESSFULLY_UPLOADED'),
            duration: 4000,
            color: 'success'
          }).then((toast) => toast.present());
        },
        error: () => {
          this.toastController.create({
            message: this.translate.instant('ERROR_WHILE_UPLOADING_FILES'),
            duration: 4000,
            color: 'danger'
          }).then((toast) => toast.present());
        }
      });
    }
    else {
      this.docsService.uploadDocs(this.user?.access_token!, this.project?._id!, formData, this.path!).subscribe({
        next: (docs) => {
          docs.forEach(doc => {
            this.uploadedDocs!.push(doc);
            this.uploadedDocs = this.sortDocs(this.uploadedDocs!);
          });
  
          this.toastController.create({
            message: this.translate.instant('FILES_SUCCESSFULLY_UPLOADED'),
            duration: 4000,
            color: 'success'
          }).then((toast) => toast.present());
        },
        error: () => {
          this.toastController.create({
            message: this.translate.instant('ERROR_WHILE_UPLOADING_FILES'),
            duration: 4000,
            color: 'danger'
          }).then((toast) => toast.present());
        }
      });
    }
  }

  onFileDownload(doc: IUploadedDoc) {
    if (doc.type === 'folder') {
      this.path = (doc.structure_path === '/' ? '' : (doc.structure_path + '/')) + doc.name;
      this.createPathBreadcrumb();
      this.location.replaceState(`/app/docs/${this.path}`);
      this.getDocs(this.project!._id);
    }
    else {
      this.docsService.downloadDoc(this.user?.access_token!, this.project?._id!, doc._id).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = doc.name;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => {
          this.toastController.create({
            message: this.translate.instant('ERROR_WHILE_DOWNLOADING_FILE'),
            duration: 4000,
            color: 'danger'
          }).then((toast) => toast.present());
        }
      });
    }
  }

  onFileEditAccess(doc: IUploadedDoc) {
    this.detailsDoc = doc;
    this.isAccessOpen = true;
  }

  async onFileDelete(doc: IUploadedDoc) {
    const alert = await this.alertController.create({
      header: this.translate.instant(doc.type === 'folder' ? 'DELETE_FOLDER' : 'DELETE_FILE'),
      message: this.translate.instant(doc.type === 'folder' ? 'DELETE_FOLDER_CONFIRMATION' : 'DELETE_FILE_CONFIRMATION'),
      buttons: [
        {
          text: this.translate.instant('CANCEL'),
          role: 'cancel',
          cssClass: 'secondary'
        }, {
          text: this.translate.instant('DELETE'),
          handler: () => this.deleteFile(doc._id)
        }
      ]
    });
    await alert.present();
  }

  deleteFile(docId: string) {
    this.docsService.deleteDoc(this.user?.access_token!, this.project?._id!, docId).subscribe({
      next: () => {
        this.uploadedDocs = this.uploadedDocs!.filter((d) => d._id !== docId);
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

  onFileDetails(doc: IUploadedDoc) {
    this.detailsDoc = doc;
    this.isDetailsOpen = true;
  }

  onFileClick(doc: IUploadedDoc) {
    if (this.fileTypesImages.includes(doc.type) || this.fileTypesVideos.includes(doc.type)){
      this.onExpandClick(doc);
    }
    else {
      this.onFileDownload(doc);
    }
  }

  onExpandClick(doc: IUploadedDoc) {
    if (this.fileTypesImages.includes(doc.type) || this.fileTypesVideos.includes(doc.type)){
      this.docsService.downloadDoc(this.user?.access_token!, this.project?._id!, doc._id).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          this.expandedDoc = { ...doc, blobUrl: url };

          if (this.fileTypesImages.includes(doc.type)) {
            this.isExpandedDocImage = true;
          }
          if (this.fileTypesVideos.includes(doc.type)) {
            this.isExpandedDocVideo = true;
          }
        },
        error: () => {
          this.toastController.create({
            message: this.translate.instant('ERROR_WHILE_LOADING_FILE'),
            duration: 4000,
            color: 'danger'
          }).then((toast) => toast.present());
        }
      });
    }
  }

  onCloseImageVideoViewer() {
    // Revoke object url
    if (this.expandedDoc?.blobUrl) {
      window.URL.revokeObjectURL(this.expandedDoc.blobUrl);
    }
  
    this.expandedDoc = undefined;
    this.isExpandedDocImage = false;
    this.isExpandedDocVideo = false;
  }

  async onNewFolderClick() {
    const alert = await this.alertController.create({
      header: this.translate.instant('NEW_FOLDER'),
      inputs: [
        {
          name: 'folderName',
          type: 'text',
          placeholder: this.translate.instant('FOLDER_NAME')
        }
      ],
      buttons: [
        {
          text: this.translate.instant('CANCEL'),
          role: 'cancel',
          cssClass: 'secondary'
        }, {
          text: this.translate.instant('CREATE'),
          handler: (inputData) => this.createFolder(inputData.folderName)
        }
      ]
    });
    await alert.present();
  }

  createFolder(name: string) {
    if (name === '$collab') {
      this.toastController.create({
        message: this.translate.instant('ILLEGAL_FOLDER_NAME'),
        duration: 4000,
        color: 'danger'
      }).then((toast) => toast.present());
      return;
    }
    if (this.selectedSection === 'uploaded') {
      this.docsService.createFolder(this.user?.access_token!, this.project?._id!, this.path!, name).subscribe({
        next: (folder) => {
          this.uploadedDocs!.push(folder);
          this.uploadedDocs = this.sortDocs(this.uploadedDocs!);
  
          this.toastController.create({
            message: this.translate.instant('FOLDER_SUCCESSFULLY_CREATED'),
            duration: 4000,
            color: 'success'
          }).then((toast) => toast.present());
        },
        error: (err) => {
          if (err.status === 409) {
            this.toastController.create({
              message: this.translate.instant('FOLDER_ALREADY_EXISTS'),
              duration: 4000,
              color: 'danger'
            }).then((toast) => toast.present());
          }
          else {
            this.toastController.create({
              message: this.translate.instant('ERROR_WHILE_CREATING_FOLDER'),
              duration: 4000,
              color: 'danger'
            }).then((toast) => toast.present());
          }
        }
      });
    }
    else if (this.selectedSection === 'collab') {
      this.collabDocsService.createFolder(this.user?.access_token!, this.project?._id!, this.path!, name).subscribe({
        next: (folder) => {
          this.collabDocs!.push(folder);
          this.collabDocs = this.sortCollabDocs(this.collabDocs!);
  
          this.toastController.create({
            message: this.translate.instant('FOLDER_SUCCESSFULLY_CREATED'),
            duration: 4000,
            color: 'success'
          }).then((toast) => toast.present());
        },
        error: (err) => {
          if (err.status === 409) {
            this.toastController.create({
              message: this.translate.instant('FOLDER_ALREADY_EXISTS'),
              duration: 4000,
              color: 'danger'
            }).then((toast) => toast.present());
          }
          else {
            this.toastController.create({
              message: this.translate.instant('ERROR_WHILE_CREATING_FOLDER'),
              duration: 4000,
              color: 'danger'
            }).then((toast) => toast.present());
          }
        }
      });
    }
  }

  async onNewDocumentClick() {
    const alert = await this.alertController.create({
      header: this.translate.instant('NEW_PAGE'),
      inputs: [
        {
          name: 'fileName',
          type: 'text',
          placeholder: this.translate.instant('PAGE_NAME')
        }
      ],
      buttons: [
        {
          text: this.translate.instant('CANCEL'),
          role: 'cancel',
          cssClass: 'secondary'
        }, {
          text: this.translate.instant('CREATE'),
          handler: (inputData) => this.createDocument(inputData.fileName)
        }
      ]
    });
    await alert.present();
  }

  createDocument(name: string) {
    this.collabDocsService.createDoc(this.user?.access_token!, this.project?._id!, this.path!, name).subscribe({
      next: (file) => {
        this.collabDocs!.push(file);
        this.collabDocs = this.sortCollabDocs(this.collabDocs!);

        this.toastController.create({
          message: this.translate.instant('DOCUMENT_SUCCESSFULLY_CREATED'),
          duration: 4000,
          color: 'success'
        }).then((toast) => toast.present());
      },
      error: (err) => {
        if (err.status === 409) {
          this.toastController.create({
            message: this.translate.instant('DOCUMENT_ALREADY_EXISTS'),
            duration: 4000,
            color: 'danger'
          }).then((toast) => toast.present());
        }
        else {
          this.toastController.create({
            message: this.translate.instant('ERROR_WHILE_CREATING_DOCUMENT'),
            duration: 4000,
            color: 'danger'
          }).then((toast) => toast.present());
        }
      }
    });
  }

  async onCollabDocDelete(doc: ICollabDoc) {
    const alert = await this.alertController.create({
      header: this.translate.instant(doc.is_folder ? 'DELETE_FOLDER' : 'DELETE_FILE'),
      message: this.translate.instant(doc.is_folder ? 'DELETE_FOLDER_CONFIRMATION' : 'DELETE_FILE_CONFIRMATION'),
      buttons: [
        {
          text: this.translate.instant('CANCEL'),
          role: 'cancel',
          cssClass: 'secondary'
        }, {
          text: this.translate.instant('DELETE'),
          handler: () => this.deleteCollabDoc(doc._id)
        }
      ]
    });
    await alert.present();
  }

  deleteCollabDoc(docId: string) {
    this.collabDocsService.deleteDoc(this.user?.access_token!, this.project?._id!, docId).subscribe({
      next: () => {
        this.collabDocs = this.collabDocs!.filter((d) => d._id !== docId);
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

  onCollabDocOpen(doc: ICollabDoc) {
    if (doc.is_folder) {
      this.path = (doc.structure_path === '/' ? '' : (doc.structure_path + '/')) + doc.name;
      this.createPathBreadcrumb();
      this.location.replaceState(`/app/docs/$collab/${this.path}`);
      this.getCollabDocs(this.project!._id);
    }
    else {
      this.router.navigate(['app/pages', doc._id]);
    }
  }

  onBackClick() {
    if (this.path === '/') {
      return;
    }
    else {
      const path = this.path!.split('/');
      path.pop();
      this.path = path.join('/');
      this.createPathBreadcrumb();
      if (!this.path?.length) {
        this.path = '/';
        this.createPathBreadcrumb();
      }
      
      if (this.selectedSection === 'uploaded') {
        this.location.replaceState(`/app/docs/${path.join('/')}`);
        this.getDocs(this.project!._id);
      }
      else if (this.selectedSection === 'collab') {
        this.location.replaceState(`/app/docs/$collab/${path.join('/')}`);
        this.getCollabDocs(this.project!._id);
      }
    }
  }

  onUploadedDocsClick() {
    if (this.selectedSection === 'collab') {
      this.selectedSection = 'uploaded';
      this.path = '/';
      this.createPathBreadcrumb();
      this.location.replaceState(`/app/docs/`);
      this.getDocs(this.project!._id);
    }
  }

  onCollabDocsClick() {
    if (this.selectedSection === 'uploaded') {
      this.selectedSection = 'collab';
      this.path = '/';
      this.createPathBreadcrumb();
      this.location.replaceState(`/app/docs/$collab/`);
      this.getCollabDocs(this.project!._id);
    }
  }

  onCollabDocDetails(doc: ICollabDoc) {
    this.collabDetailsDoc = doc;
    this.isCollabDetailsOpen = true;
  }

  onCollabDocEditAccess(doc: ICollabDoc) {
    this.collabDetailsDoc = doc;
    this.isCollabAccessOpen = true;
  }

  closeCollabDetails() {
    this.isCollabDetailsOpen = false;
  }

  closeCollabAccess() {
    this.isCollabAccessOpen = false;
  }

  saveCollabAccess(doc: ICollabDoc) {
    this.isCollabAccessOpen = false;
    const oldDoc = this.collabDocs?.find(d => d._id === doc._id);
    if (oldDoc) {
      oldDoc.roles = doc.roles;
      oldDoc.users = doc.users;
      oldDoc.edit_roles = doc.edit_roles;
      oldDoc.edit_users = doc.edit_users;
      oldDoc.updatedAt = doc.updatedAt;
    }
  }

  createPathBreadcrumb() {
    const path = this.path!.split('/');
    this.pathBreadcrumb = path;
  }

  onBreadcrumbClick(index: number) {
    const path = this.pathBreadcrumb.slice(0, index + 1).join('/');
    this.path = (path === '' ? '/' : path);
    this.createPathBreadcrumb();
    
    if (this.selectedSection === 'uploaded') {
      this.location.replaceState(`/app/docs/${this.path}`);
      this.getDocs(this.project!._id);
    }
    else if (this.selectedSection === 'collab') {
      this.location.replaceState(`/app/docs/$collab/${this.path}`);
      this.getCollabDocs(this.project!._id);
    }
  }

  onHomeBreadcrumbClick() {
    this.path = '/';
    this.createPathBreadcrumb();
    
    if (this.selectedSection === 'uploaded') {
      this.location.replaceState(`/app/docs/${this.path}`);
      this.getDocs(this.project!._id);
    }
    else if (this.selectedSection === 'collab') {
      this.location.replaceState(`/app/docs/$collab/${this.path}`);
      this.getCollabDocs(this.project!._id);
    }
  }

  closeDetails() {
    this.isDetailsOpen = false;
  }

  closeAccess() {
    this.isAccessOpen = false;
  }

  saveAccess(doc: IUploadedDoc) {
    this.isAccessOpen = false;
    const oldDoc = this.uploadedDocs?.find(d => d._id === doc._id);
    if (oldDoc) {
      oldDoc.roles = doc.roles;
      oldDoc.users = doc.users;
      oldDoc.updatedAt = doc.updatedAt;
    }
  }

  getUserNameAtId(id?: string) {
    if (!id) {
      return this.translate.instant('UNKNOWN');
    }
    const user = this.projectUsers!.find(e => e._id === id);
    return user ? user.first_name + ' ' + user.last_name : this.translate.instant('UNKNOWN');
  }

  hasCompatibleRole(roles: any, id?: string) {
    const user = this.project?.users!.find(e => e.userId === id);
    if (user?.role === ProjectRole.OWNER) {
      return true;
    }
    if (roles && roles.includes(user?.role)) {
      return true;
    }
    return false;
  }

  onWebSocketDocsCreate(docs: IUploadedDoc[]) {
    docs.forEach(doc => {
      this.onWebSocketDocCreate(doc);
    });
  }

  onWebSocketDocCreate(doc: IUploadedDoc) {
    if (this.selectedSection === 'uploaded' && doc.structure_path === this.path) {
      this.uploadedDocs!.push(doc);
      this.uploadedDocs = this.sortDocs(this.uploadedDocs!);
    }
  }

  onWebSocketDocUpdate(doc: IUploadedDoc) {
    const oldDoc = this.uploadedDocs?.find(d => d._id === doc._id);
    if (oldDoc) {
      oldDoc.roles = doc.roles;
      oldDoc.users = doc.users;
    }
  }

  onWebSocketDocDelete(doc: IUploadedDoc) {
    this.uploadedDocs = this.uploadedDocs!.filter((d) => d._id !== doc._id);
  }

  onWebSocketCollabDocCreate(doc: ICollabDoc) {
    if (this.selectedSection === 'collab' && doc.structure_path === this.path) {
      this.collabDocs!.push(doc);
      this.collabDocs = this.sortCollabDocs(this.collabDocs!);
    }
  }

  onWebSocketCollabDocUpdate(doc: ICollabDoc) {
    const oldDoc = this.collabDocs?.find(d => d._id === doc._id);
    if (oldDoc) {
      oldDoc.roles = doc.roles;
      oldDoc.users = doc.users;
      oldDoc.edit_roles = doc.edit_roles;
      oldDoc.edit_users = doc.edit_users;
    }
  }

  onWebSocketCollabDocDelete(doc: ICollabDoc) {
    this.collabDocs = this.collabDocs!.filter((d) => d._id !== doc._id);
  }
}
