import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { IItem } from 'src/app/models/item';
import { IUserPartner } from 'src/app/models/user';
import { ItemPropertyIconComponent } from '../item-property-icon/item-property-icon.component';
import { ItemEstimateBadgeComponent } from '../item-estimate-badge/item-estimate-badge.component';

@Component({
  selector: 'app-item-list',
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    TranslateModule,
    ItemPropertyIconComponent,
    ItemEstimateBadgeComponent
  ]
})
export class ItemListComponent implements OnChanges {
  @Output() itemClicked = new EventEmitter<string>();
  @Input() items?: IItem[] = [];
  @Input() projectUsers?: IUserPartner[];

  totalComplexity = 0;
  totalHoursLeft = 0;

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['items'] && changes['items'].currentValue) {
      this.calculateTotalComplexity();
      this.calculateTotalHoursLeft();
    }
  }

  onItemClick(itemId: string) {
    this.itemClicked.emit(itemId);
  }

  getAssigneeName(assigneeId: string): string {
    if (this.projectUsers) {
      const assignee = this.projectUsers.find((user) => user._id === assigneeId);
      return assignee ? assignee.first_name + ' ' + assignee.last_name.substring(0, 1) + '.' : '';
    }
    return '';
  }

  calculateTotalComplexity() {
    this.totalComplexity = this.items?.reduce((total, item) => total + (item.complexity ?? 0), 0) ?? 0;
  }

  calculateTotalHoursLeft() {
    this.totalHoursLeft = this.items?.reduce((total, item) => total + (
      item.hours_left && item.hours_left > 0 ? item.hours_left : 0 ?? 0
    ), 0) ?? 0;
  }
}
