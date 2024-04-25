import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { addIcons } from 'ionicons';
import {
  removeOutline,
  reorderTwoOutline,
  reorderThreeOutline,
  reorderFourOutline,
  removeCircleOutline,
  briefcaseOutline,
  flagOutline,
  bookOutline,
  fileTrayStackedOutline,
  fileTrayOutline,
  buildOutline,
  bookmarkOutline,
  bookmarksOutline,
  bugOutline,
  flaskOutline,
  bulbOutline,
  addCircleOutline,
  createOutline,
  trashOutline,
  arrowUpCircleOutline,
  arrowDownCircleOutline,
  logInOutline,
  logOutOutline,
} from 'ionicons/icons';
import { ItemPriority, ItemType } from 'src/app/models/item';
import { TranslateModule } from '@ngx-translate/core';
import { LogAction } from 'src/app/models/log';

@Component({
  selector: 'app-item-property-icon',
  templateUrl: './item-property-icon.component.html',
  styleUrls: ['./item-property-icon.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    TranslateModule,
    MatTooltipModule
  ]
})
export class ItemPropertyIconComponent implements OnInit, OnChanges {
  @Input() property?: string;
  @Input() size?: number = 1.3;
  @Input() inverse = false;
  @Input() background?: string = 'transparent';

  icon = '';
  color = '';

  constructor() {
    addIcons({
      removeOutline,
      reorderTwoOutline,
      reorderThreeOutline,
      reorderFourOutline,
      removeCircleOutline,
      briefcaseOutline,
      flagOutline,
      bookOutline,
      fileTrayStackedOutline,
      fileTrayOutline,
      buildOutline,
      bookmarkOutline,
      bookmarksOutline,
      bugOutline,
      flaskOutline,
      bulbOutline,
      addCircleOutline,
      createOutline,
      trashOutline,
      arrowUpCircleOutline,
      arrowDownCircleOutline,
      logInOutline,
      logOutOutline,
    });
  }

  ngOnInit() {
    this.setIcon();
  }

  ngOnChanges(): void {
    this.setIcon();
  }

  setIcon() {
    switch (this.property) {
      case ItemPriority.LOW:
        this.icon = 'remove-outline';
        this.color = 'success';
        break;
      case ItemPriority.MEDIUM:
        this.icon = 'reorder-two-outline';
        this.color = 'secondary';
        break;
      case ItemPriority.HIGH:
        this.icon = 'reorder-three-outline';
        this.color = 'primary';
        break;
      case ItemPriority.CRITICAL:
        this.icon = 'reorder-four-outline';
        this.color = 'danger';
        break;
      case ItemPriority.BLOCKER:
        this.icon = 'remove-circle-outline';
        this.color = 'danger';
        break;
      case ItemType.EPIC:
        this.icon = 'briefcase-outline';
        this.color = 'dark';
        break;
      case ItemType.MILESTONE:
        this.icon = 'flag-outline';
        this.color = 'tertiary';
        break;
      case ItemType.STORY:
        this.icon = 'book-outline';
        this.color = 'primary';
        break;
      case ItemType.FEATURE:
        this.icon = 'file-tray-stacked-outline';
        this.color = 'secondary';
        break;
      case ItemType.SUB_FEATURE:
        this.icon = 'file-tray-outline';
        this.color = 'secondary';
        break;
      case ItemType.IMPROVEMENT:
        this.icon = 'build-outline';
        this.color = 'success';
        break;
      case ItemType.TASK:
        this.icon = 'bookmark-outline';
        this.color = 'primary';
        break;
      case ItemType.SUB_TASK:
        this.icon = 'bookmarks-outline';
        this.color = 'primary';
        break;
      case ItemType.BUG:
        this.icon = 'bug-outline';
        this.color = 'danger';
        break;
      case ItemType.TEST:
        this.icon = 'flask-outline';
        this.color = 'success';
        break;
      case ItemType.CUSTOMER_REQUIREMENT:
        this.icon = 'bulb-outline';
        this.color = 'warning';
        break;
      case ItemType.FUNCTIONAL_REQUIREMENT:
        this.icon = 'bulb-outline';
        this.color = 'warning';
        break;
      case ItemType.NON_FUNCTIONAL_REQUIREMENT:
        this.icon = 'bulb-outline';
        this.color = 'warning';
        break;
      case LogAction.CREATE:
        this.icon = 'add-circle-outline';
        this.color = 'success';
        break;
      case LogAction.UPDATE:
        this.icon = 'create-outline';
        this.color = 'warning';
        break;
      case LogAction.DELETE:
        this.icon = 'trash-outline';
        this.color = 'danger';
        break;
      case LogAction.PUSHED:
        this.icon = 'arrow-up-circle-outline';
        this.color = 'success';
        break;
      case LogAction.PULLED:
        this.icon = 'arrow-down-circle-outline';
        this.color = 'danger';
        break;
      case LogAction.LOGIN:
        this.icon = 'log-in-outline';
        this.color = 'success';
        break;
      case LogAction.LOGOUT:
        this.icon = 'log-out-outline';
        this.color = 'danger';
        break;
      default:
        this.icon = 'remove-outline';
        this.color = 'primary';
        break;
    }
  }
}
