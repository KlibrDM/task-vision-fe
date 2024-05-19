import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, notificationsOutline, searchOutline, businessOutline } from 'ionicons/icons';
import { SearchPopupComponent } from '../search-popup/search-popup.component';
import { AuthService } from 'src/app/services/auth.service';

interface navbarItem {
  code: string;
  translation_code?: string;
  icon?: string;
  action: () => void;
}

@Component({
  selector: 'app-board-navbar',
  templateUrl: './board-navbar.component.html',
  styleUrls: ['./board-navbar.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    SearchPopupComponent,
  ]
})
export class BoardNavbarComponent implements OnInit {
  navbarLeftItems: navbarItem[] = [
    {
      code: 'projects',
      translation_code: 'PROJECTS',
      action: () => this.goTo('/app/projects'),
    },
  ];
  navbarRightItems: navbarItem[] = [
    {
      code: 'search',
      icon: 'search-outline',
      action: () => this.openSearch(),
    },
    {
      code: 'notifications',
      icon: 'notifications-outline',
      action: () => this.openNotifications(),
    },
    {
      code: 'profile',
      icon: 'person-outline',
      action: () => this.goTo('/app/profile'),
    },
  ];
  navbarOrganizationItem: navbarItem = {
    code: 'organization',
    icon: 'business-outline',
    action: () => this.goTo('/app/organization'),
  }
  

  isSearchOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private translate: TranslateService,
  ) {
    addIcons({ personOutline, notificationsOutline, searchOutline, businessOutline });
  }

  ngOnInit(): void {
    this.authService.currentUser.subscribe((user) => {
      if (user && user.is_organization_controlled) {
        const profileIndex = this.navbarRightItems.findIndex((item) => item.code === 'profile');
        if (profileIndex !== -1) {
          this.navbarRightItems.splice(profileIndex, 0, this.navbarOrganizationItem);
        }
      }
      else {
        const organizationIndex = this.navbarRightItems.findIndex((item) => item.code === 'organization');
        if (organizationIndex !== -1) {
          this.navbarRightItems.splice(organizationIndex, 1);
        }
      }
    });
  }

  goTo(route: string) {
    this.router.navigate([route]);
  }

  openNotifications() {
    this.alertController.create({
      header: this.translate.instant('COMING_SOON'),
      buttons: [this.translate.instant('OK')]
    }).then((alert) => alert.present());
  }

  openSearch() {
    this.isSearchOpen = true;
  }

  closeSearch() {
    this.isSearchOpen = false;
  }
}
