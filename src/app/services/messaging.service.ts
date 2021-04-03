import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireMessaging } from '@angular/fire/messaging';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { mergeMap, mergeMapTo } from 'rxjs/operators';
import { Token } from '../interfaces/token';
import * as firebase from 'firebase';

@Injectable({
  providedIn: 'root',
})
export class MessagingService {
  private messaging = firebase.default.messaging();

  currentMessage = new BehaviorSubject(null);

  constructor(
    private msg: AngularFireMessaging,
    private db: AngularFirestore,
    private snackBar: MatSnackBar
  ) {
    // this.messaging.getToken({
    //   vapidKey:
    //     'BC3WiS6p2C8B303gUBsDGwouELI-juo03jFagpLlYbFzaYKoPhYeJfLZipRIRFHYaQwi8edRHNKrQ3bqVQzUBsY',
    // });
  }

  requestPermission(uid: string) {
    if (!uid) {
      this.snackBar.open(
        'トークンの取得に失敗しました。ログインしていますか？'
      );
    }
    this.msg.requestToken.subscribe(
      (token) => this.db.doc(`users/${uid}/tokens/${token}`).set({ token }),
      (error) =>
        this.snackBar.open(
          'トークンの取得に失敗しました' + ' ' + 'エラー:' + error
        )
    );
  }

  deleteToken(uid: string) {
    this.msg.getToken
      .pipe(mergeMap((token) => this.msg.deleteToken(token)))
      .subscribe((token) => {
        this.db.doc(`users/${uid}/tokens/${token}`);
      });
  }

  getTokens(uid: string): Observable<Token[]> {
    return this.db.collection<Token>(`users/${uid}/tokens`).valueChanges();
  }

  receiveMessage() {
    console.log('receive');

    this.messaging.onMessage((payload) => {
      console.log(payload);
      this.currentMessage.next(payload);
    });
  }
}
