import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { personOutline } from 'ionicons/icons';

interface INavbarItem {
  code: string;
  translation_code: string;
  link: string;
  icon?: string;
}

@Component({
  selector: 'app-home-navbar',
  templateUrl: './home-navbar.component.html',
  styleUrls: ['./home-navbar.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslateModule]
})
export class HomeNavbarComponent {
  logoPath = './src/assets/images/logo1.png';
  navbarLeftItems: INavbarItem[] = [];
  navbarRightItems: INavbarItem[] = [
    {
      code: 'login',
      translation_code: 'LOGIN',
      link: '/login',
      icon: 'person-outline'
    },
  ]

  @Input() showLogin = true;

  constructor(
    private router: Router
  ) {
    addIcons({personOutline});
  }

  goTo(route: string) {
    this.router.navigate([route]);
  }
}
