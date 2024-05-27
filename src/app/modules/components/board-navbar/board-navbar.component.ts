import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { personOutline, notificationsOutline, searchOutline, businessOutline } from 'ionicons/icons';
import { SearchPopupComponent } from '../search-popup/search-popup.component';
import { AuthService } from 'src/app/services/auth.service';
import { NotificationsDrawerComponent } from '../notifications-drawer/notifications-drawer.component';
import { NotificationService } from 'src/app/services/notification.service';
import { SocketService } from 'src/app/services/socket.service';
import { WS_CLIENT_EVENTS } from 'src/app/models/ws';

interface navbarItem {
  code: string;
  translation_code?: string;
  icon?: string;
  badge_number?: number;
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
    NotificationsDrawerComponent,
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
      badge_number: 0,
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
  isNotificationsOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private socketService: SocketService,
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

    this.notificationService.unreadCount.subscribe((count) => {
      this.navbarRightItems.find((item) => item.code === 'notifications')!.badge_number = count;
    });

    this.socketService.serverMessage.subscribe((message) => {
      if (message.event === WS_CLIENT_EVENTS.NEW_NOTIFICATION) {
        if (!this.isNotificationsOpen) {
          this.notificationService.increaseUnreadCount();
        }
      }
    });
  }

  goTo(route: string) {
    this.router.navigate([route]);
  }

  openNotifications() {
    this.isNotificationsOpen = !this.isNotificationsOpen;
  }

  closeNotifications() {
    this.isNotificationsOpen = false;
  }

  openSearch() {
    this.isSearchOpen = true;
  }

  closeSearch() {
    this.isSearchOpen = false;
  }
}
