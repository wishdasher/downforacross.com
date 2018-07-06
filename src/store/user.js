import firebase, { db, SERVER_TIME, offline } from './firebase';
import getLocalId from '../localAuth';
import EventEmitter from 'events';
import { getTime } from '../actions';
import { rand_color } from '../jsUtils';

export default class User extends EventEmitter {
  constructor() {
    super();
    this.auth = firebase.auth();
    this.attached = false;
    this.color = rand_color();
  }

  attach() {
    this.auth.onAuthStateChanged((user) => {
      this.attached = true;
      this.fb = user;
      this.emit('auth');
    });
  }

  detach() {
  }

  logIn() {
    const provider = new firebase.auth.FacebookAuthProvider();
    this.auth.signInWithPopup(provider);
  }

  get ref() {
    return db.ref(`user/${this.id}`);
  }

  get id() {
    if (!this.attached) {
      return undefined;
    }
    if (this.fb) {
      return this.fb.uid;
    }
    return getLocalId();
  }

  onAuth(cbk) {
    this.addListener('auth', cbk);
    if (this.attached) {
      cbk();
    }
  }

  joinGame(gid, game) {
    const time = getTime();
    // safe to call this multiple times
    this.ref
      .child('history')
      .child(gid)
      .set({
        pid: game.pid,
        solved: game.solved || false,
        // progress: game.progress,
        time,
      });
  }

  markSolved(gid) {
    this.ref
      .child('history')
      .child(gid)
      .transaction(item => {
      if (!item) return null;
      return {
        ...item,
        solved: true,
      }
    });
  }

  recordUsername(username) {
    const id = this.id;
    this.ref
      .child('names')
      .child(username)
      .transaction((count = 0) => (
        count + 1));
  }
}

let globalUser;
export const getUser = () => {
  if (!globalUser) {
    globalUser = new User();
    globalUser.attach();
  }
  return globalUser;
};