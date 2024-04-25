import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-management-header',
  templateUrl: './management-header.component.html',
  styleUrls: ['./management-header.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslateModule]
})
export class ManagementHeaderComponent {
  @Input() parent?: string;
  @Input() projectName?: string;
  @Input() addItemText?: string;
  @Output() addItemClick = new EventEmitter();

  constructor() { }

  onAddItemClicked() {
    this.addItemClick.emit();
  }
}
