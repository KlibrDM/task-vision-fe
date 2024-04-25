import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-item-estimate-badge',
  templateUrl: './item-estimate-badge.component.html',
  styleUrls: ['./item-estimate-badge.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
  ]
})
export class ItemEstimateBadgeComponent {
  @Input() estimate?: number;
  @Input() type?: 'complexity' | 'estimate';
  @Input() size?: number = 0.9;

  constructor() {}
}
