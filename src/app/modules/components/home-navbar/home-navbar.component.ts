import { CommonModule } from '@angular/common';
import { Component, Input, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { globeOutline, personOutline } from 'ionicons/icons';
import { Languages } from 'src/app/models/constants';
import { StorageService } from 'src/app/services/storage.service';

interface INavbarItem {
  code: string;
  translation_code: string;
  icon?: string;
  action: () => void;
}

@Component({
  selector: 'app-home-navbar',
  templateUrl: './home-navbar.component.html',
  styleUrls: ['./home-navbar.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslateModule]
})
export class HomeNavbarComponent {
  navbarLeftItems: INavbarItem[] = [];
  navbarRightItems: INavbarItem[] = [
    {
      code: 'language',
      translation_code: 'LANGUAGE',
      icon: 'globe-outline',
      action: () => this.languageSelect?.open(),
    },
    {
      code: 'login',
      translation_code: 'LOGIN',
      icon: 'person-outline',
      action: () => this.goTo('/login'),
    },
  ];

  @ViewChild('languageSelect') languageSelect: any;
  @Input() showLogin = true;

  language = 'en';
  languages = Languages;

  constructor(
    private router: Router,
    private storageService: StorageService,
    private translate: TranslateService,
  ) {
    addIcons({ personOutline, globeOutline });
    this.language = this.translate.currentLang;
  }

  goTo(route: string) {
    this.router.navigate([route]);
  }

  onLanguageChange(event: any) {
    this.storageService.set('language', event);
    this.translate.use(event);
  }
}
