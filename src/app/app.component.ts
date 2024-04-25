import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet} from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';
import { StorageService } from './services/storage.service';
import { AuthService } from './services/auth.service';
import { IUser } from './models/user';
import { SocketService } from './services/socket.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {

  constructor(
    protected translate: TranslateService,
    protected storageService: StorageService,
    protected authService: AuthService,
    protected socketService: SocketService
  ) {
    translate.setDefaultLang('en');
    translate.use('en');
  }

  ngOnInit(): void {
    this.storageService.get('language').then((language) => {
      if (language) {
        this.translate.use(language);
      }
    });

    this.storageService.get('user').then((user: IUser) => {
      if (user && user.access_token) {
        this.authService.whoAmI(user.access_token).subscribe({
          next: (user) => {
            this.authService.setCurrentUser(user);
          },
          error: () => {
            this.authService.localLogout();
          }
        })
      }
    });
  }
}
