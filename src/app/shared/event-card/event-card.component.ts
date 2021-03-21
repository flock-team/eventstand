import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { fade } from 'src/app/animations/animations';
import { Event } from 'src/app/interfaces/event';
import { EventService } from 'src/app/services/event.service';
import { EventDetailDialogComponent } from '../event-detail-dialog/event-detail-dialog.component';

@Component({
  selector: 'app-event-card',
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.scss'],
  animations: [fade],
})
export class EventCardComponent implements OnInit {
  @Input() event: Event;
  @Input() uid: string;
  @Input() type: string;
  ownerEvents: string[];

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private eventService: EventService
  ) {}

  ngOnInit(): void {}

  openDetailDialog(event: Event, $event): void {
    $event.stopPropagation();
    this.dialog.open(EventDetailDialogComponent, {
      data: {
        event,
        uid: this.uid,
        type: this.type,
      },
    });
  }

  navigateDetail(event: Event) {
    let userType;
    if (event.ownerId === this.uid) {
      userType = 'owner';
    }
    this.router.navigate([`/event/${event.eventId}`], {
      queryParams: { type: userType },
    });
  }

  joinChannel(event: Event): void {
    if (event.startAt < this.eventService.dateNow) {
      this.router.navigateByUrl(`/event/${event.eventId}/${this.uid}`);
    } else {
      this.navigateDetail(event);
    }
  }
}
