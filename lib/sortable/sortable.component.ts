import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  TemplateRef
} from '@angular/core';
import {NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/forms';
import {DraggableItem} from './draggable-item';
import {DraggableItemService} from './draggable-item.service';

/* tslint:disable */
@Component({
  selector: 'xs-sortable',
  exportAs: 'xs-sortable',
  template: `
    <div
      [ngClass]="wrapperClass"
      [ngStyle]="wrapperStyle"
      [ngStyle]="wrapperStyle"
      (dragover)="cancelEvent($event)"
      (dragenter)="cancelEvent($event)"
      (drop)="resetActiveItem($event)"
      (mouseleave)="resetActiveItem($event)">
      <div
        *ngIf="showPlaceholder"
        [ngClass]="placeholderClass"
        [ngStyle]="placeholderStyle"
        (dragover)="onItemDragover($event, 0)"
        (dragenter)="cancelEvent($event)"
      >{{placeholderItem}}
      </div>
      <div
        *ngFor="let item of items; let i=index;"
        [ngClass]="[ itemClass, i === activeItem ? itemActiveClass : '' ]"
        [ngStyle]="getItemStyle(i === activeItem)"
        draggable="true"
        (dragstart)="onItemDragstart($event, item, i)"
        (dragend)="resetActiveItem($event)"
        (dragover)="onItemDragover($event, i)"
        (dragenter)="cancelEvent($event)"
        aria-dropeffect="move"
        [attr.aria-grabbed]="i === activeItem"
      >
        <ng-template [ngTemplateOutlet]="itemTemplate || defItemTemplate"
                     [ngTemplateOutletContext]="{item:item, index: i}"></ng-template>
      </div>
      <ng-template #defItemTemplate let-item="item">{{item}}</ng-template>
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SortableComponent),
      multi: true
    }
  ]
})
/* tslint:enable */
export class SortableComponent implements ControlValueAccessor {
  private static globalZoneIndex = 0;
  /** field name if input array consists of objects */
  @Input() fieldName: string;

  /** class name for items wrapper */
  @Input() wrapperClass = '';

  /** style object for items wrapper */
  @Input() wrapperStyle: { [key: string]: string } = {};

  /** class name for item */
  @Input() itemClass = '';

  /** style object for item */
  @Input() itemStyle: { [key: string]: string } = {};

  /** class name for active item */
  @Input() itemActiveClass = '';

  /** style object for active item */
  @Input() itemActiveStyle: { [key: string]: string } = {};

  /** class name for placeholder */
  @Input() placeholderClass = '';

  /** style object for placeholder */
  @Input() placeholderStyle: { [key: string]: string } = {};

  /** placeholder item which will be shown if collection is empty */
  @Input() placeholderItem = '';

  /** used to specify a custom item template. Template variables: item and index; */
  @Input() itemTemplate: TemplateRef<any>;

  /** fired on array change (reordering, insert, remove), same as <code>ngModelChange</code>.
   *  Returns new items collection as a payload.
   */
  @Output() onChange: EventEmitter<any[]> = new EventEmitter<any[]>();

  /** fired on drag start */
  @Output() dragStart: EventEmitter<void> = new EventEmitter<void>();

  /** fired on drag end */
  @Output() dragEnd: EventEmitter<void> = new EventEmitter<void>();

  showPlaceholder = false;
  activeItem = -1;

  get items(): any[] {
    return this._items;
  }

  set items(value: any[]) {
    this._items = value;
    this.onChanged(this._items);
    this.onChange.emit(this._items);
  }

  onTouched: any = Function.prototype;
  onChanged: any = Function.prototype;

  private transfer: DraggableItemService;
  private currentZoneIndex: number;
  private _items: any[];

  constructor(transfer: DraggableItemService) {
    this.transfer = transfer;
    this.currentZoneIndex = SortableComponent.globalZoneIndex++;
    this.transfer
      .onCaptureItem()
      .subscribe((item: DraggableItem) => this.onDrop(item));
  }

  onItemDragstart(
    event: DragEvent,
    item: any,
    i: number
  ): void {
    this.initDragstartEvent(event);
    this.onTouched();
    this.transfer.dragStart({
      event,
      item,
      i,
      initialIndex: i,
      lastZoneIndex: this.currentZoneIndex,
      overZoneIndex: this.currentZoneIndex
    });
    this.dragStart.emit();
  }

  onItemDragover(event: DragEvent, i: number): void {
    let moved = false;
    if (!this.transfer.getItem()) {
      return;
    }
    event.preventDefault();
    const dragItem = this.transfer.captureItem(
      this.currentZoneIndex,
      this.items.length
    );
    let newArray: any[] = [];
    if (!this.items.length) {
      moved = true;
      newArray = [dragItem.item];
    } else if (dragItem.i > i) {
      moved = true;
      newArray = [
        ...this.items.slice(0, i),
        dragItem.item,
        ...this.items.slice(i, dragItem.i),
        ...this.items.slice(dragItem.i + 1)
      ];
    } else if (dragItem.i < i) {
      // this.draggedItem.i < i
      moved = true;
      newArray = [
        ...this.items.slice(0, dragItem.i),
        ...this.items.slice(dragItem.i + 1, i + 1),
        dragItem.item,
        ...this.items.slice(i + 1)
      ];
    }
    if (moved) {
      this.items = newArray;
      dragItem.i = i;
      this.activeItem = i;
      this.updatePlaceholderState();
    }
  }

  cancelEvent(event: DragEvent): void {
    if (!this.transfer.getItem() || !event) {
      return;
    }
    event.preventDefault();
  }

  onDrop(item: DraggableItem): void {
    if (
      item &&
      item.overZoneIndex !== this.currentZoneIndex &&
      item.lastZoneIndex === this.currentZoneIndex
    ) {
      this.items = this.items.filter(
        (x: any, i: number) => i !== item.i
      );
      this.updatePlaceholderState();
    }
    this.resetActiveItem(undefined);
  }

  resetActiveItem(event: DragEvent): void {
    this.cancelEvent(event);
    this.activeItem = -1;
    this.dragEnd.emit();
  }

  registerOnChange(callback: (_: any) => void): void {
    this.onChanged = callback;
  }

  registerOnTouched(callback: () => void): void {
    this.onTouched = callback;
  }

  writeValue(value: any[]): void {
    if (value) {
      this.items = value;
    } else {
      this.items = [];
    }
    this.updatePlaceholderState();
  }

  updatePlaceholderState(): void {
    this.showPlaceholder = !this._items.length;
  }

  getItemStyle(isActive: boolean): {} {
    return isActive
      ? Object.assign({}, this.itemStyle, this.itemActiveStyle)
      : this.itemStyle;
  }

  // tslint:disable-next-line
  private initDragstartEvent(event: DragEvent): void {
    // it is necessary for mozilla
    // data type should be 'Text' instead of 'text/plain' to keep compatibility
    // with IE
    event.dataTransfer.setData('Text', 'placeholder');
  }
}
