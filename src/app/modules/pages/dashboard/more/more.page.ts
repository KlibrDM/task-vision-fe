import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BoardNavbarComponent } from 'src/app/modules/components/board-navbar/board-navbar.component';
import { AuthService } from 'src/app/services/auth.service';
import { IUser } from 'src/app/models/user';
import { ProjectService } from 'src/app/services/project.service';
import { IProject, ProjectRole } from 'src/app/models/project';
import { combineLatest } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  playForwardOutline,
  barChartOutline,
  personOutline,
  constructOutline,
  readerOutline,
} from 'ionicons/icons';
import { BoardHeaderComponent } from 'src/app/modules/components/board-header/board-header.component';
import { ItemCreateModalComponent } from 'src/app/modules/components/item-create-modal/item-create-modal.component';
import { ItemDetailsModalComponent } from 'src/app/modules/components/item-details-modal/item-details-modal.component';
import { ItemListComponent } from 'src/app/modules/components/item-list/item-list.component';

interface IMoreMenusView {
  code: string;
  translation_code: string;
  link: string;
  icon: string;
  roles: ProjectRole[];
}

const moreMenus: IMoreMenusView[] = [
  {
    code: 'sprint_planner',
    translation_code: 'SPRINT_PLANNER',
    link: '/app/sprint-planner',
    icon: 'play-forward-outline',
    roles: [ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.BOARDMASTER]
  },
  {
    code: 'charts',
    translation_code: 'CHARTS_REPORTS',
    link: '/app/charts',
    icon: 'bar-chart-outline',
    roles: [
      ProjectRole.OWNER,
      ProjectRole.ADMIN,
      ProjectRole.BOARDMASTER,
      ProjectRole.QA,
      ProjectRole.MEMBER
    ]
  },
  {
    code: 'manage_members',
    translation_code: 'MANAGE_MEMBERS',
    link: '/app/manage-members',
    icon: 'person-outline',
    roles: [ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.BOARDMASTER]
  },
  {
    code: 'project_settings',
    translation_code: 'PROJECT_SETTINGS',
    link: '/app/project-settings',
    icon: 'construct-outline',
    roles: [ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.BOARDMASTER]
  },
  {
    code: 'logs',
    translation_code: 'LOGS',
    link: '/app/logs',
    icon: 'reader-outline',
    roles: [ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.BOARDMASTER]
  },
];

@Component({
  selector: 'app-more',
  templateUrl: './more.page.html',
  styleUrls: ['./more.page.scss'],
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
export class MorePage {
  user?: IUser;
  project?: IProject;

  moreMenusView: IMoreMenusView[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private projectService: ProjectService,
  ) {
    addIcons({ playForwardOutline, barChartOutline, personOutline, constructOutline, readerOutline });
  }

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
          this.createMenusView();
        }
        else {
          this.projectService.getProject(this.user!.access_token!, id).subscribe((project) => {
            this.project = project;
            this.projectService.setCurrentProject(project, this.user?._id!);
            this.createMenusView();
          });
        }
      });
    });
  }

  createMenusView() {
    const userRoles = this.project?.users.find((user) => user.userId === this.user?._id!)?.role;
    if (!userRoles) {
      return;
    }
    this.moreMenusView = moreMenus.filter((menu) => menu.roles.includes(userRoles));
  }

  onMenuClick(menu: any) {
    this.router.navigate([menu.link]);
  }
}
