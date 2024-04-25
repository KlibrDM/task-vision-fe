import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, notificationsOutline } from 'ionicons/icons';

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
  imports: [IonicModule, CommonModule, FormsModule, TranslateModule]
})
export class BoardNavbarComponent {
  navbarLeftItems: navbarItem[] = [
    {
      code: 'projects',
      translation_code: 'PROJECTS',
      action: () => this.goTo('/app/projects'),
    },
  ];
  navbarRightItems: navbarItem[] = [
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
  ]

  constructor(
    private router: Router,
    private alertController: AlertController,
    private translate: TranslateService,
  ) {
    addIcons({ personOutline, notificationsOutline });
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
}
