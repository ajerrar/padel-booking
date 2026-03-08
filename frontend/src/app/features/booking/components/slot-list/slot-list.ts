import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SlotItem = { time: string; isAvailable: boolean };

@Component({
  selector: 'app-slot-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slot-list.html',
  styleUrls: ['./slot-list.css'],
})
export class SlotList {
  @Input() selectedDate = '';           // YYYY-MM-DD
  @Input() slots: SlotItem[] = [];
  @Input() selectedTime: string | null = null;

  @Output() dateChange = new EventEmitter<string>();
  @Output() slotSelect = new EventEmitter<SlotItem>();

  onDateInput(ev: Event) {
    const v = (ev.target as HTMLInputElement).value || '';
    this.dateChange.emit(v);
  }

  pick(slot: SlotItem) {
    if (!slot.isAvailable) return;
    this.slotSelect.emit(slot);
  }
}
