import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.html'
})
export class StatCard {

  @Input() title = '';
  @Input() value: number | string = 0;
  @Input() icon = '';

}
