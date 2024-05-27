import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BoardNavbarComponent } from 'src/app/modules/components/board-navbar/board-navbar.component';
import { AuthService } from 'src/app/services/auth.service';
import { IUser, IUserPartner } from 'src/app/models/user';
import { ProjectService } from 'src/app/services/project.service';
import { IProject } from 'src/app/models/project';
import { IItem, ItemType } from 'src/app/models/item';
import { Subject, combineLatest } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  playForwardOutline,
  barChartOutline,
  personOutline,
  constructOutline
} from 'ionicons/icons';
import { ISprint } from 'src/app/models/sprint';
import { SprintService } from 'src/app/services/sprint.service';
import { ItemService } from 'src/app/services/item.service';
import { ItemDetailsContentComponent } from 'src/app/modules/components/item-details-content/item-details-content.component';
import { SocketService } from 'src/app/services/socket.service';
import { WS_CLIENT_EVENTS } from 'src/app/models/ws';

@Component({
  selector: 'app-item',
  templateUrl: './item.page.html',
  styleUrls: ['./item.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    BoardNavbarComponent,
    ItemDetailsContentComponent
  ]
})
export class ItemPage {
  user?: IUser;
  project?: IProject;
  item?: IItem;
  items?: IItem[];
  projectUsers?: IUserPartner[];
  epics?: IItem[];
  sprints?: ISprint[];
  isLoading = true;

  itemId?: string | null;

  allowEdit = false;
  saveClicked = new Subject<void>();
  discardClicked = new Subject<void>();
  allowEditClicked = new Subject<void>();

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    private projectService: ProjectService,
    private sprintService: SprintService,
    private itemService: ItemService,
    private socketService: SocketService
  ) {
    addIcons({ playForwardOutline, barChartOutline, personOutline, constructOutline});
  }

  ionViewWillEnter() {
    combineLatest([
      this.authService.currentUser,
      this.projectService.getActiveProjectId()
    ]).subscribe(([user, id]) => {
      // Get item ID from route
      this.itemId = this.activatedRoute.snapshot.paramMap.get('id');

      if (!this.itemId) {
        this.router.navigate(['app/board']);
        return;
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
      this.projectService.setActiveProjectId(this.user!.access_token!, id);

      this.projectService.currentProject.subscribe((project) => {
        if (project) {
          this.project = project;
          this.getProjectDetails(project._id);
        }
        else {
          this.projectService.getProject(this.user!.access_token!, id).subscribe((project) => {
            this.project = project;
            this.projectService.setCurrentProject(project, this.user?._id!);
            this.getProjectDetails(project._id);
          });
        }
      });
    });

    this.socketService.serverMessage.subscribe((message) => {
      switch (message.event) {
        case WS_CLIENT_EVENTS.ITEM_CHANGED:
        case WS_CLIENT_EVENTS.ITEM_DELETED:
          this.onWebSocketItemUpdate(message.payload as IItem);
          break;
        case WS_CLIENT_EVENTS.ITEM_CREATED:
          this.onWebSocketItemCreate(message.payload as IItem);
          break;
        case WS_CLIENT_EVENTS.SPRINT_CREATED:
          this.onWebSocketSprintCreate(message.payload as ISprint);
          break;
        case WS_CLIENT_EVENTS.SPRINT_CHANGED:
        case WS_CLIENT_EVENTS.SPRINT_DELETED:
          this.onWebSocketSprintUpdate(message.payload as ISprint);
          break;
        default:
          break;
      }
    });
  }

  getProjectDetails(projectId: string) {
    combineLatest([
      this.itemService.getItems(this.user!.access_token!, projectId),
      this.projectService.getProjectUsers(this.user!.access_token!, projectId),
      this.sprintService.getSprints(this.user!.access_token!, projectId)
    ]).subscribe(([items, users, sprints]) => {
      this.items = items;
      this.item = items.find(i => i._id === this.itemId);
      this.epics = items.filter(e => e.type === ItemType.EPIC && !e.deleted);
      this.projectUsers = users;
      this.sprints = sprints;
      this.isLoading = false;
    });
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

  onItemDeleted() {
    this.allowEdit = false;
  }

  // WebSocket Item
  onWebSocketItemUpdate(item: IItem) {
    const itemIndex = this.items?.findIndex(oldItem => oldItem._id === item._id);
    if (itemIndex !== undefined && itemIndex !== -1) {
      this.items![itemIndex] = item;

      if (this.item && this.item._id === item._id) {
        this.item = item;
      }

      if (item.type === ItemType.EPIC) {
        this.epics = this.items?.filter(e => e.type === ItemType.EPIC && !e.deleted);
      }
    }
  }

  onWebSocketItemCreate(item: IItem) {
    this.items?.push(item);
    if (item.type === ItemType.EPIC) {
      this.epics = this.items?.filter(e => e.type === ItemType.EPIC && !e.deleted);
    }
  }

  // WebSocket Sprint
  onWebSocketSprintUpdate(sprint: ISprint) {
    const sprintIndex = this.sprints?.findIndex(oldSprint => oldSprint._id === sprint._id);
    if (sprintIndex !== undefined && sprintIndex !== -1) {
      this.sprints![sprintIndex] = sprint;
    }
  }

  onWebSocketSprintCreate(sprint: ISprint) {
    this.sprints?.push(sprint);
  }
}
