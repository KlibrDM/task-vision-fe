import { Component, ViewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import markdownit from 'markdown-it';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BoardNavbarComponent } from 'src/app/modules/components/board-navbar/board-navbar.component';
import { AlertController, ToastController } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { ProjectService } from 'src/app/services/project.service';
import { CollabDocsService } from 'src/app/services/collabDocs.service';
import { SocketService } from 'src/app/services/socket.service';
import { Subject, combineLatest, debounceTime, distinctUntilChanged, first, takeUntil } from 'rxjs';
import { IUser, IUserPartner } from 'src/app/models/user';
import { IProject, ProjectRole } from 'src/app/models/project';
import { Router } from '@angular/router';
import { WS_CLIENT_EVENTS } from 'src/app/models/ws';
import { ICollabDoc } from 'src/app/models/collabDocs';
import { sparklesOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { Languages } from 'src/app/models/constants';

@Component({
  selector: 'app-pages',
  templateUrl: './pages.page.html',
  styleUrls: ['./pages.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    BoardNavbarComponent,
  ]
})
export class PagesPage {
  destroyed$: Subject<boolean> = new Subject();
  @ViewChild('documentContent') documentContentTextArea: any;
  
  md = markdownit({
    linkify: true,
  });

  user?: IUser;
  userRole?: ProjectRole;
  project?: IProject;
  projectUsers?: IUserPartner[];

  docId?: string;
  doc?: ICollabDoc;

  docNameInput = '';
  docAISummaryInput = '';
  docContentInput = '';
  docContentMD = '';
  docAILanguage = 'en';

  contentQueryChanged: Subject<string> = new Subject<string>();
  isAISummaryGenerating = false;

  allowEdit = false;
  activeUsers: string[] = [];
  editedBy?: string;

  languages = Languages;

  constructor(
    private router: Router,
    private toastController: ToastController,
    private translate: TranslateService,
    private authService: AuthService,
    private projectService: ProjectService,
    private collabDocsService: CollabDocsService,
    private alertController: AlertController,
    private location: Location,
    private socketService: SocketService,
  ) {
    addIcons({ sparklesOutline });
  }

  ionViewDidLeave() {
    this.destroyed$.next(true);
    this.destroyed$.unsubscribe();
  }

  ionViewWillEnter() {
    this.destroyed$ = new Subject();

    combineLatest([
      this.authService.currentUser,
      this.projectService.activeProjectId
    ]).pipe(takeUntil(this.destroyed$))
      .pipe(first())
      .subscribe(([user, id]) => {
        // Get folder structure path from route
        this.docId = decodeURI(this.location.path().substring(11));

        if (!user) {
          this.router.navigate(['']);
          return;
        }
        this.user = user;

        if (!id) {
          this.router.navigate(['app/projects']);
          return;
        }
        this.projectService.setActiveProjectId(this.user!.access_token!, id);
        this.socketService.changeActiveCollabDoc(this.user!._id, this.docId!);

        this.projectService.currentProject
          .pipe(takeUntil(this.destroyed$))
          .subscribe((project) => {
            if (project) {
              this.project = project;
              this.getData()
            }
            else {
              this.projectService.getProject(this.user!.access_token!, id)
                .pipe(takeUntil(this.destroyed$))
                .subscribe((project) => {
                  this.project = project;
                  this.projectService.setCurrentProject(project, this.user?._id!);
                  this.getData();
                });
            }
          });
      });

    this.socketService.serverMessage.pipe(takeUntil(this.destroyed$)).subscribe((message) => {
      switch (message.event) {
        case WS_CLIENT_EVENTS.ACTIVE_COLLAB_DOC_ACTIVE_USERS:
          this.onWebSocketActiveUsersChanged(message.payload as string[]);
          break;
        case WS_CLIENT_EVENTS.ACTIVE_COLLAB_DOC_EDITED_BY:
          this.onWebSocketEditStatusChanged(message.payload as string);
          break;
        case WS_CLIENT_EVENTS.COLLAB_DOC_CHANGED:
          this.onWebSocketDocChanged(message.payload as ICollabDoc);
          break;
        default:
          break;
      }
    });

    this.contentQueryChanged
      .pipe(takeUntil(this.destroyed$))
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((content) => {
        this.getContentMD(content);
      });

    this.docAILanguage = this.translate.currentLang;
  }

  ionViewWillLeave() {
    this.socketService.unsetActiveCollabDoc(this.user!._id);
    this.socketService.setCollabDocEditedBy('', this.doc!._id);
  }

  getData() {
    this.projectService.getProjectUsers(this.user!.access_token!, this.project!._id).subscribe((users) => {
      this.projectUsers = users;
      this.userRole = this.projectUsers.find((user) => user._id === this.user!._id)?.role;
    });

    this.collabDocsService.getCollabDoc(this.user!.access_token!, this.project!._id, this.docId!).subscribe((doc) => {
      if (!doc.content) {
        doc.content = '';
      }
      this.doc = doc;
      this.docNameInput = doc.name;
      this.docContentInput = doc.content ?? '';
      this.docAISummaryInput = doc.ai_summary ?? '';
      this.editedBy = doc.is_edited_by;
      this.getContentMD(doc.content);
    });
  }

  getContentMD(content?: string) {
    this.docContentMD = this.md.render(content || this.translate.instant('PAGE_DOESNT_HAVE_CONTENT'));
  }

  onEditClick() {
    this.allowEdit = true;
    this.socketService.setCollabDocEditedBy(this.user!._id, this.doc!._id);
  }

  onDiscardClick() {
    this.docNameInput = this.doc!.name;
    this.docContentInput = this.doc!.content ?? '';
    this.docAISummaryInput = this.doc!.ai_summary ?? '';
    this.getContentMD(this.doc!.content);

    this.socketService.setCollabDocEditedBy('', this.doc!._id);
    this.allowEdit = false;
  }

  onSaveClick() {
    this.collabDocsService.updateDoc(this.user!.access_token!, this.project!._id, this.doc!._id, this.docNameInput, this.docContentInput, this.docAISummaryInput).subscribe({
      next: (doc) => {
        if (!doc.content) {
          doc.content = '';
        }
        this.doc = doc;
        this.docNameInput = doc.name;
        this.docContentInput = doc.content ?? '';
        this.docAISummaryInput = doc.ai_summary ?? '';
        this.getContentMD(doc.content);

        this.socketService.setCollabDocEditedBy('', this.doc!._id);
        this.allowEdit = false;
      },
      error: () => {
        this.toastController.create({
          message: this.translate.instant('ERROR_WHILE_SAVING'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      }
    });
  }

  onContentChange(event: string) {
    this.contentQueryChanged.next(event);
  }
  
  onSeeActiveUsersClick() {
    this.alertController.create({
      header: this.translate.instant('ACTIVE_USERS'),
      message: this.activeUsers.map(e => this.getUserNameAtId(e)).join('\n'),
      cssClass: 'alert-text-pre',
      buttons: [this.translate.instant('OK')]
    }).then((alert) => alert.present());
  }

  onSeeAiSummaryClick() {
    if (!this.doc?.ai_summary) {
      return;
    }

    this.alertController.create({
      header: this.translate.instant('AI_SUMMARY'),
      message: this.doc.ai_summary,
      cssClass: 'alert-text-pre',
      buttons: [this.translate.instant('OK')]
    }).then((alert) => alert.present());
  }

  onGenerateAiSummaryClick() {
    if (!this.docNameInput || !this.docContentInput) {
      return;
    }

    const fullLanguageName = this.languages.find(e => e.code === this.docAILanguage)?.english_name || this.docAILanguage;

    this.isAISummaryGenerating = true;

    this.collabDocsService.getDocAISummary(this.user!.access_token!, {
      name: this.docNameInput,
      content: this.docContentInput,
      language: fullLanguageName,
    }).subscribe({
      next: (res) => {
        this.docAISummaryInput = res.summary;
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
    });
  }

  getUserNameAtId(id: string) {
    const user = this.projectUsers?.find((user) => user._id === id);
    return user?.first_name + ' ' + user?.last_name ?? this.translate.instant('UNKNOWN');
  }

  onWebSocketActiveUsersChanged(users: string[]) {
    this.activeUsers = users;
  }

  onWebSocketEditStatusChanged(editedBy: string) {
    if (!editedBy) {
      this.editedBy = undefined;
    }
    else {
      this.editedBy = editedBy;
    }
  }

  onWebSocketDocChanged(doc: ICollabDoc) {
    if (!doc.content) {
      doc.content = '';
    }
    this.doc = doc;
    this.docNameInput = doc.name;
    this.docContentInput = doc.content ?? '';
    this.docAISummaryInput = doc.ai_summary ?? '';
    this.getContentMD(doc.content);
  }
}
