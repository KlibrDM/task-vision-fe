import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, combineLatest, first, takeUntil } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { ProjectService } from 'src/app/services/project.service';
import { IProject } from 'src/app/models/project';
import { IUser, IUserPartner } from 'src/app/models/user';
import { NotificationService } from 'src/app/services/notification.service';
import { INotification } from 'src/app/models/notification';
import { NotificationCardComponent } from '../notification-card/notification-card.component';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { SocketService } from 'src/app/services/socket.service';
import { WS_CLIENT_EVENTS } from 'src/app/models/ws';

@Component({
  selector: 'app-notifications-drawer',
  templateUrl: './notifications-drawer.component.html',
  styleUrls: ['./notifications-drawer.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    NotificationCardComponent,
  ]
})
export class NotificationsDrawerComponent implements OnInit, OnDestroy {
  destroyed$: Subject<boolean> = new Subject();
  @Output() closeNotifications = new EventEmitter<void>();

  user?: IUser;
  project?: IProject;
  projectUsers: IUserPartner[] = [];
  notifications: INotification[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private projectService: ProjectService,
    private notificationsService: NotificationService,
    private socketService: SocketService,
  ) {
    addIcons({ closeOutline });
  }

  ngOnInit(): void {
    combineLatest([
      this.authService.currentUser,
      this.projectService.activeProjectId
    ]).pipe(takeUntil(this.destroyed$))
      .pipe(first())
      .subscribe(([user, id]) => {
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

        this.projectService.currentProject
          .pipe(takeUntil(this.destroyed$))
          .subscribe((project) => {
            if (project) {
              this.project = project;
              this.getNotificationsData(project._id);
            }
            else {
              this.projectService.getProject(this.user!.access_token!, id)
                .pipe(takeUntil(this.destroyed$))
                .subscribe((project) => {
                  this.project = project;
                  this.projectService.setCurrentProject(project, this.user?._id!);
                  this.getNotificationsData(project._id);
                });
            }
          });
      });

    this.socketService.serverMessage.pipe(takeUntil(this.destroyed$)).subscribe((message) => {
      if (message.event === WS_CLIENT_EVENTS.NEW_NOTIFICATION) {
        this.notifications.unshift(message.payload as INotification);
        this.notificationsService.markNotificationsAsRead(this.user!.access_token!, this.project!._id).subscribe();
      }
    });

    // Close notification drawer on navigation
    this.router.events.pipe(takeUntil(this.destroyed$)).subscribe((e) => {
      if (e.constructor.name === 'NavigationStart') {
        this.closeNotifications.emit();
      }
    });
  }

  ngOnDestroy() {
    this.destroyed$.next(true);
    this.destroyed$.unsubscribe();
  }

  getNotificationsData(projectId: string) {
    combineLatest([
      this.notificationsService.getNotifications(this.user!.access_token!, projectId),
      this.projectService.getProjectUsers(this.user!.access_token!, projectId),
    ]).pipe(takeUntil(this.destroyed$)).subscribe(([notifications, users]) => {
      this.notifications = notifications;
      this.projectUsers = users;

      // Mark notifications as read
      this.notificationsService.markNotificationsAsRead(this.user!.access_token!, projectId).subscribe();
      this.notificationsService.resetUnreadCount();
    });
  }

  onBackdropClick() {
    this.closeNotifications.emit();
  }

  onCloseClick() {
    this.closeNotifications.emit();
  }

  onContentClick(e: MouseEvent) {
    e.stopPropagation();
  }
}
