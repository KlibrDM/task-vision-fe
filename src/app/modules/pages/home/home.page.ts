import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HomeNavbarComponent } from '../../components/home-navbar/home-navbar.component';
import { AuthService } from 'src/app/services/auth.service';
import { IUser } from 'src/app/models/user';
import { addIcons } from 'ionicons';
import { checkmarkOutline } from 'ionicons/icons';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    HomeNavbarComponent
  ]
})
export class HomePage {
  destroyed$: Subject<boolean> = new Subject();

  user?: IUser;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    addIcons({ checkmarkOutline });
  }

  ionViewDidLeave() {
    this.destroyed$.next(true);
    this.destroyed$.unsubscribe();
  }

  ionViewWillEnter() {
    this.destroyed$ = new Subject();

    this.authService.currentUser
      .pipe(takeUntil(this.destroyed$))
      .subscribe((user) => {
        this.user = user;
      });
  }

  goToRoute(route: string) {
    this.router.navigate([route]);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToRegisterUser() {
    this.router.navigate(['/register-user']);
  }

  goToRegisterOrganization() {
    this.router.navigate(['/register-organization']);
  }

  goToBoard() {
    if (this.user) {
      this.router.navigate([
        this.user.active_projectId ? '/app/board' : '/app/projects'
      ]);
    }
  }

  logout() {
    this.authService.logout(this.user!.access_token!).subscribe();
  }
}
