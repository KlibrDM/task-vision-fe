import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BoardNavbarComponent } from 'src/app/modules/components/board-navbar/board-navbar.component';
import { AuthService } from 'src/app/services/auth.service';
import { IUser, IUserPartner } from 'src/app/models/user';
import { ProjectService } from 'src/app/services/project.service';
import { IProject } from 'src/app/models/project';
import { IItem, IItemPayload, ItemType } from 'src/app/models/item';
import { ItemService } from 'src/app/services/item.service';
import { combineLatest } from 'rxjs';
import { BoardHeaderComponent } from 'src/app/modules/components/board-header/board-header.component';
import { ItemCreateModalComponent } from 'src/app/modules/components/item-create-modal/item-create-modal.component';
import { ISprint } from 'src/app/models/sprint';
import { SprintService } from 'src/app/services/sprint.service';
import { ItemDetailsModalComponent } from 'src/app/modules/components/item-details-modal/item-details-modal.component';
import moment from 'moment';
import { ItemListComponent } from 'src/app/modules/components/item-list/item-list.component';
import { SocketService } from 'src/app/services/socket.service';
import { WS_CLIENT_EVENTS } from 'src/app/models/ws';
import { DocsService } from 'src/app/services/docs.service';
import { AlertController } from '@ionic/angular/standalone';

interface BacklogView {
  name: string,
  code: string,
  type: 'default' | 'sprints',
  items?: IItem[],
  sprints?: {
    sprint: ISprint,
    items: IItem[],
  }[],
}

@Component({
  selector: 'app-backlog',
  templateUrl: './backlog.page.html',
  styleUrls: ['./backlog.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    BoardNavbarComponent,
    BoardHeaderComponent,
    ItemCreateModalComponent,
    ItemDetailsModalComponent,
    ItemListComponent
  ]
})
export class BacklogPage {
  user?: IUser;
  project?: IProject;
  items?: IItem[];
  projectUsers?: IUserPartner[];
  epics?: IItem[];
  sprints?: ISprint[];

  showOnlyMine = false;
  isCreateModalOpen = false;
  isDetailsModalOpen = false;
  selectedItem?: IItem;

  selectedViewSegment = "backlog";
  selectedView?: BacklogView;
  backlogView: BacklogView[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private projectService: ProjectService,
    private sprintService: SprintService,
    private itemService: ItemService,
    private translate: TranslateService,
    private socketService: SocketService,
    private docsService: DocsService,
    private alertController: AlertController,
  ) {}

  ionViewWillEnter() {
    combineLatest([
      this.authService.currentUser,
      this.projectService.getActiveProjectId()
    ]).subscribe(([user, id]) => {
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
        case WS_CLIENT_EVENTS.PROJECT_CHANGED:
          this.onWebSocketProjectUpdate(message.payload as IProject);
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
      this.epics = items.filter(e => e.type === ItemType.EPIC && !e.deleted);
      this.projectUsers = users;
      this.sprints = sprints;
      this.createBacklogView();
      this.onSelectedViewChange({ detail: { value: this.selectedViewSegment } });
    });
  }

  createBacklogView() {
    this.backlogView = [];
    this.backlogView.push({
      name: this.translate.instant('BACKLOG'),
      code: 'backlog',
      type: 'default',
      items: this.items!
        .filter((item) => (item.sprintId === undefined || !item.sprintId.length) && !item.deleted)
        .filter((item) => this.showOnlyMine ? item.assigneeId === this.user?._id : item)
    });
    this.backlogView.push({
      name: this.translate.instant('ACTIVE_SPRINT'),
      code: 'active_sprint',
      type: 'default',
      sprints: [{
        sprint: this.sprints!.find((sprint) => sprint._id === this.project?.currentSprintId)!,
        items: this.project?.currentSprintId
          ? this.items!
              .filter((item) => item.sprintId?.includes(this.project?.currentSprintId!) && !item.deleted)
              .filter((item) => this.showOnlyMine ? item.assigneeId === this.user?._id : item)
          : []
      }]
    });
    this.backlogView.push({
      name: this.translate.instant('EPICS'),
      code: 'epics',
      type: 'default',
      items: this.epics!
        .filter((item) => !item.deleted)
        .filter((item) => this.showOnlyMine ? item.assigneeId === this.user?._id : item)
    });
    this.backlogView.push({
      name: this.translate.instant('REQUIREMENTS'),
      code: 'requirements',
      type: 'default',
      items: this.items!
        .filter((item) =>
          item.type === ItemType.CUSTOMER_REQUIREMENT
          || item.type === ItemType.FUNCTIONAL_REQUIREMENT
          || item.type === ItemType.NON_FUNCTIONAL_REQUIREMENT
        )
        .filter((item) => !item.deleted)
        .filter((item) => this.showOnlyMine ? item.assigneeId === this.user?._id : item)
    });
    this.backlogView.push({
      name: this.translate.instant('BUGS'),
      code: 'bugs',
      type: 'default',
      items: this.items!
        .filter((item) => item.type === ItemType.BUG && !item.deleted)
        .filter((item) => this.showOnlyMine ? item.assigneeId === this.user?._id : item)
    });
    this.backlogView.push({
      name: this.translate.instant('TESTS'),
      code: 'tests',
      type: 'default',
      items: this.items!
        .filter((item) => item.type === ItemType.TEST && !item.deleted)
        .filter((item) => this.showOnlyMine ? item.assigneeId === this.user?._id : item)
    });
    this.backlogView.push({
      name: this.translate.instant('ALL_SPRINTS'),
      code: 'sprints',
      type: 'sprints',
      sprints: this.sprints!
        .sort((a,b) => moment(a.start_date).isBefore(b.start_date) ? -1 : 1)
        .map((sprint) => ({
          sprint: sprint,
          items: this.items!
            .filter((item) => item.sprintId?.includes(sprint._id) && !item.deleted)
            .filter((item) => this.showOnlyMine ? item.assigneeId === this.user?._id : item)
        }))
        .filter((sprint) => !sprint.sprint.deleted || sprint.items.length > 0)
    });
  }

  onSelectedViewChange(newViewChangeEvent: any) {
    const newView = newViewChangeEvent.detail.value;
    this.selectedViewSegment = newView;

    const newViewObj = this.backlogView.find((view) => view.code === newView);
    if (newViewObj) {
      this.selectedView = newViewObj;
    }
  }

  forceSelectedViewUpdate() {
    this.selectedView = this.backlogView.find((view) => view.code === this.selectedViewSegment);
  }

  // Only mine toggle
  onShowOnlyMineToggle(event: boolean) {
    this.showOnlyMine = event;
    this.createBacklogView();
    this.forceSelectedViewUpdate();
  }

  // Details modal
  onItemClicked(itemId: string) {
    const item = this.items!.find((item) => item._id === itemId);
    this.selectedItem = item;
    this.isDetailsModalOpen = true;
  }

  onDetailsModalClose() {
    this.isDetailsModalOpen = false;
  }

  onItemChanged(item: IItem) {
    const itemIndex = this.items?.findIndex(oldItem => oldItem._id === item._id);
    if (itemIndex !== undefined && itemIndex !== -1) {
      this.items![itemIndex] = item;
      this.createBacklogView();
    }
    this.forceSelectedViewUpdate();
  }

  // Create modal
  onCreateItemClick() {
    this.isCreateModalOpen = true;
  }

  onCreateModalClose() {
    this.isCreateModalOpen = false;
  }

  onCreateModalConfirm(payload: { item: IItemPayload, files: File[] }) {
    this.isCreateModalOpen = false;
    this.itemService.createItem(this.user?.access_token || '', payload.item).subscribe((item) => {
      this.items?.push(item);
      this.createBacklogView();
      this.forceSelectedViewUpdate();

      // Upload attachments
      if (payload.files.length > 0) {
        const formData = new FormData();
        for (let i = 0; i < payload.files.length; i++) {
          formData.append('files', payload.files[i], payload.files[i].name);
        }
        this.docsService.uploadItemAttachments(this.user?.access_token || '', this.project!._id, item._id, formData).subscribe();
      }
    });
  }

  // Filters
  onFiltersClick() {
    this.alertController.create({
      header: this.translate.instant('COMING_SOON'),
      buttons: [this.translate.instant('OK')]
    }).then((alert) => alert.present());
  }

  onWebSocketItemUpdate(item: IItem) {
    const itemIndex = this.items?.findIndex(oldItem => oldItem._id === item._id);
    if (itemIndex !== undefined && itemIndex !== -1) {
      this.items![itemIndex] = item;

      if (this.selectedItem && this.selectedItem._id === item._id) {
        this.selectedItem = item;
      }

      if (item.type === ItemType.EPIC) {
        this.epics = this.items?.filter(e => e.type === ItemType.EPIC && !e.deleted);
      }

      this.createBacklogView();
      this.forceSelectedViewUpdate();
    }
  }

  onWebSocketItemCreate(item: IItem) {
    this.items?.push(item);
    if (item.type === ItemType.EPIC) {
      this.epics = this.items?.filter(e => e.type === ItemType.EPIC && !e.deleted);
    }
    this.createBacklogView();
    this.forceSelectedViewUpdate();
  }

  onWebSocketSprintUpdate(sprint: ISprint) {
    const sprintIndex = this.sprints?.findIndex(oldSprint => oldSprint._id === sprint._id);
    if (sprintIndex !== undefined && sprintIndex !== -1) {
      this.sprints![sprintIndex] = sprint;
      this.createBacklogView();
      this.forceSelectedViewUpdate();
    }
  }

  onWebSocketSprintCreate(sprint: ISprint) {
    this.sprints?.push(sprint);
    this.createBacklogView();
    this.forceSelectedViewUpdate();
  }

  onWebSocketProjectUpdate(project: IProject) {
    this.project = project;
    this.projectService.setCurrentProject(project, this.user?._id!);
    this.createBacklogView();
    this.forceSelectedViewUpdate();
  }
}
