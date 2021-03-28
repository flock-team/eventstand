import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { combineLatest, Observable, of } from 'rxjs';
import { combineAll, map, switchMap } from 'rxjs/operators';
import { Invite, InviteWithSender } from '../intefaces/invite';
import { User } from '../interfaces/user';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class MeetingService {
  constructor(private db: AngularFirestore, private userService: UserService) {}

  createRoomId() {
    return this.db.createId();
  }

  createInvite(uid: string, roomId: string, senderUid: string) {
    this.db.doc(`users/${uid}/invite/${roomId}`).set({
      roomId,
      senderUid,
    });
  }

  getInvites(uid: string): Observable<InviteWithSender[]> {
    return this.db
      .collection<Invite>(`users/${uid}/invite`)
      .valueChanges()
      .pipe(
        switchMap((invites: Invite[]) => {
          const uniqueSenderIds = Array.from(
            new Set(
              invites.map((invite) => {
                return invite.senderUid;
              })
            )
          );
          const senders$: Observable<User[]> = combineLatest(
            uniqueSenderIds.map((id) => this.userService.getUserData(id))
          );
          return combineLatest([of(invites), senders$]);
        }),
        map(([invites, senders]) => {
          return invites.map((invite) => {
            return {
              ...invite,
              sender: senders.find((sender) => invite.senderUid === sender.uid),
            };
          });
        })
      );
  }
}
