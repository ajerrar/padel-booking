import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SlotItem = { time: string; isAvailable: boolean };

@Component({
  selector: 'app-slot-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slot-list.html',
})
export class SlotList {
  @Input() selectedDate = '';           // YYYY-MM-DD
  @Input() slots: SlotItem[] = [];
  @Input() selectedTime: string | null = null;

  @Output() dateChange = new EventEmitter<string>();
  @Output() slotSelect = new EventEmitter<SlotItem>();

  // Methode onDateInput: gere on date input de ce bloc.
  onDateInput(ev: Event) {
    const v = (ev.target as HTMLInputElement).value || '';
    this.dateChange.emit(v);
  }

  // Methode pick: gere pick de ce bloc.
  pick(slot: SlotItem) {
    if (!slot.isAvailable) return;
    this.slotSelect.emit(slot);
  }
}
