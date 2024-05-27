import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BoardNavbarComponent } from 'src/app/modules/components/board-navbar/board-navbar.component';
import { AuthService } from 'src/app/services/auth.service';
import { IUser, IUserPartner } from 'src/app/models/user';
import { ProjectService } from 'src/app/services/project.service';
import { IProject, ProjectRole } from 'src/app/models/project';
import { IItem, IItemPayload, ItemType } from 'src/app/models/item';
import { ItemService } from 'src/app/services/item.service';
import { combineLatest } from 'rxjs';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronDownOutline, chevronUpOutline } from 'ionicons/icons';
import { BoardHeaderComponent } from 'src/app/modules/components/board-header/board-header.component';
import { ItemCreateModalComponent } from 'src/app/modules/components/item-create-modal/item-create-modal.component';
import { ISprint } from 'src/app/models/sprint';
import { SprintService } from 'src/app/services/sprint.service';
import { ItemDetailsModalComponent } from 'src/app/modules/components/item-details-modal/item-details-modal.component';
import { ItemEstimateBadgeComponent } from 'src/app/modules/components/item-estimate-badge/item-estimate-badge.component';
import { ItemPropertyIconComponent } from 'src/app/modules/components/item-property-icon/item-property-icon.component';
import { SocketService } from 'src/app/services/socket.service';
import { WS_CLIENT_EVENTS } from 'src/app/models/ws';
import { DocsService } from 'src/app/services/docs.service';
import { AlertController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-board',
  templateUrl: './board.page.html',
  styleUrls: ['./board.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    BoardNavbarComponent,
    DragDropModule,
    BoardHeaderComponent,
    ItemCreateModalComponent,
    ItemDetailsModalComponent,
    ItemPropertyIconComponent,
    ItemEstimateBadgeComponent
  ]
})
export class BoardPage {
  user?: IUser;
  project?: IProject;
  items?: IItem[];
  projectUsers?: IUserPartner[];
  epics?: IItem[];
  sprints?: ISprint[];
  boardView: (IUserPartner & { 
    expanded: boolean,
    itemsCount: number,
    columns: {
      name: string,
      items: (IItem & { epicName?: string })[]
    }[]
  })[] = [];
  showOnlyMine = false;
  isCreateModalOpen = false;
  isDetailsModalOpen = false;
  selectedItem?: IItem;
  isMobile = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private projectService: ProjectService,
    private sprintService: SprintService,
    private itemService: ItemService,
    private toastController: ToastController,
    private translate: TranslateService,
    private socketService: SocketService,
    private docsService: DocsService,
    private alertController: AlertController
  ) {
    addIcons({ chevronDownOutline, chevronUpOutline });
  }

  ionViewWillEnter() {
    this.isMobile = window.innerWidth < 768;
    this.boardView = [];

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
      this.createBoardView();
    });
  }

  createBoardView() {
    const prevBoardView = this.boardView;
    this.boardView = this.projectUsers!
      .filter(user => this.showOnlyMine ? user._id === this.user?._id : user)
      .filter(user => user.is_active)
      .map((user) => {
        const items = this.items!.filter((item) =>
          item.assigneeId === user._id
          && !item.deleted
          && item.sprintId?.includes(this.project?.currentSprintId ?? '')
        );

        return ({
          ...user,
          expanded: prevBoardView.find(prevUserView => prevUserView._id === user._id)?.expanded ?? true,
          itemsCount: items.length,
          columns: this.project!.board_columns.map((column) => (
            {
              name: column,
              items: items.filter((item) => item.column === column)
            }
          ))
        })
      });

    // Show unassigned items
    if (!this.showOnlyMine) {
      const unassignedItems = this.items!.filter((item) =>
        item.assigneeId === undefined
        && !item.deleted
        && item.sprintId?.includes(this.project?.currentSprintId ?? '')
      );

      if (unassignedItems.length) {
        this.boardView.unshift({
          _id: '[UNASSIGNED]',
          first_name: this.translate.instant('UNASSIGNED'),
          last_name: '',
          email: '',
          is_organization_controlled: false,
          organizationId: '',
          is_active: true,
          role: ProjectRole.MEMBER,
          expanded: prevBoardView.find(prevUserView => prevUserView._id === '[UNASSIGNED]')?.expanded ?? true,
          itemsCount: unassignedItems.length,
          columns: this.project!.board_columns.map((column) => (
            {
              name: column,
              items: unassignedItems.filter((item) => item.column === column)
            }
          ))
        });
      }
    }

    // Set epic names
    const epicMap: Map<string, string> = new Map();
    this.boardView.forEach((user) => {
      user.columns.forEach((column) => {
        column.items.forEach((item) => {
          if (item.epicId) {
            item.epicName = epicMap.get(item.epicId) ?? undefined;
            // If epic name not found in map get it from items
            if (!item.epicName) {
              const epicName = this.items?.find((e) => e._id === item.epicId)?.name;
              if (epicName) {
                epicMap.set(item.epicId, epicName);
                item.epicName = epicName;
              }
            }
          }
        });
      });
    });
  }

  // User expand
  onUserExpandToggle(index: number) {
    this.boardView[index].expanded = !this.boardView[index].expanded;
  }

  // Only mine toggle
  onShowOnlyMineToggle(event: boolean) {
    this.showOnlyMine = event;
    this.createBoardView();
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
      this.createBoardView();

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

  // Details modal
  onItemDetailsClick(item: IItem) {
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
      this.createBoardView();
    }
  }

  // Filters
  onFiltersClick() {
    this.alertController.create({
      header: this.translate.instant('COMING_SOON'),
      buttons: [this.translate.instant('OK')]
    }).then((alert) => alert.present());
  }

  // WebSocket Item
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
      this.createBoardView();
    }
  }

  onWebSocketItemCreate(item: IItem) {
    this.items?.push(item);
    if (item.type === ItemType.EPIC) {
      this.epics = this.items?.filter(e => e.type === ItemType.EPIC && !e.deleted);
    }
    this.createBoardView();
  }

  // WebSocket Sprint
  onWebSocketSprintUpdate(sprint: ISprint) {
    const sprintIndex = this.sprints?.findIndex(oldSprint => oldSprint._id === sprint._id);
    if (sprintIndex !== undefined && sprintIndex !== -1) {
      this.sprints![sprintIndex] = sprint;
      this.createBoardView();
    }
  }

  onWebSocketSprintCreate(sprint: ISprint) {
    this.sprints?.push(sprint);
    this.createBoardView();
  }

  // WebSocket Project
  onWebSocketProjectUpdate(project: IProject) {
    this.project = project;
    this.projectService.setCurrentProject(project, this.user?._id!);
    this.createBoardView();
  }

  onItemDrop(event: CdkDragDrop<string[]>) {
    const itemId = event.item.element.nativeElement.id;
    const columnCode = event.container.id;
    let userId: string | undefined = columnCode.split('_')[0];
    const column = columnCode.split('_')[1];
    
    const item = this.items!.find((i) => i._id === itemId);
    if (!item) {
      return;
    }

    // If userId is special case [UNASSIGNED] then set it to undefined
    if (userId === '[UNASSIGNED]') {
      userId = undefined;
    }

    // Create payload
    const itemPayload: IItemPayload = { ...item as IItemPayload, column, assigneeId: userId };

    // Optimistic update
    const oldColumn = item.column;
    const oldAssigneeId = item.assigneeId;
    item.column = column;
    item.assigneeId = userId;
    this.createBoardView();

    this.itemService.updateItem(this.user!.access_token!, this.project!._id, itemId, itemPayload).subscribe({
      next: (item) => {
        // Update item with server response
        const itemIndex = this.items!.findIndex((i) => i._id === item._id);
        if (itemIndex !== -1) {
          this.items![itemIndex] = item;
          this.createBoardView();
        }
      },
      error: () => {
        // Revert optimistic update
        item.column = oldColumn;
        item.assigneeId = oldAssigneeId;
        this.createBoardView();

        this.toastController.create({
          message: this.translate.instant('ITEM_UPDATE_FAILED'),
          duration: 4000,
          color: 'danger'
        }).then((toast) => toast.present());
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.isMobile = event.target.innerWidth < 768;
  }
}
