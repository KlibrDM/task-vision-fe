import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { combineLatest } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { ProjectService } from 'src/app/services/project.service';
import { ItemService } from 'src/app/services/item.service';
import { IItem } from 'src/app/models/item';
import { IProject } from 'src/app/models/project';
import { IUser } from 'src/app/models/user';
import { ItemPropertyIconComponent } from '../item-property-icon/item-property-icon.component';

@Component({
  selector: 'app-search-popup',
  templateUrl: './search-popup.component.html',
  styleUrls: ['./search-popup.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    ItemPropertyIconComponent
  ]
})
export class SearchPopupComponent {
  @Output() closePopup = new EventEmitter<void>();

  user?: IUser;
  project?: IProject;
  items?: IItem[] = [];

  searchText: string = '';
  filteredItems: IItem[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private projectService: ProjectService,
    private itemService: ItemService,
  ) {
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
          this.getItems(project._id);
        }
        else {
          this.projectService.getProject(this.user!.access_token!, id).subscribe((project) => {
            this.project = project;
            this.projectService.setCurrentProject(project, this.user?._id!);
            this.getItems(project._id);
          });
        }
      });
    });

    // Close popup on navigation
    router.events.subscribe((e) => {
      if (e.constructor.name === 'NavigationStart') {
        this.closePopup.emit();
      }
    });
  }

  getItems(projectId: string) {
    this.itemService.getItems(this.user!.access_token!, projectId).subscribe((items) => {
      this.items = items;
    });
  }

  filterItems() {
    if (this.searchText === '') {
      this.filteredItems = [];
      return;
    }

    this.filteredItems = this.items!.filter((item) => (
      item.name.toLowerCase().includes(this.searchText.toLowerCase())
      || item.code.toLowerCase().includes(this.searchText.toLowerCase())
    ));
  }

  onBackdropClick() {
    this.closePopup.emit();
  }

  onContentClick(e: MouseEvent) {
    e.stopPropagation();
  }
}
