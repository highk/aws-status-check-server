import 'dotenv/config';

import { Tail } from 'tail';

export type ConnectMethod = "pemkey" | "password" | "none";

export interface LocalLogReaderOption {
  host: string;
  file: string;
}

export class LocalLogReader {
  host: string;
  file: string;
  tail?: Tail;
  logs: string[];
  subscribe?: any[];
  status: boolean;

  constructor (option: LocalLogReaderOption) {
    this.host = option.host;
    this.file = option.file;
    this.tail = null;
    this.logs = [];
    this.subscribe = [];
    this.status = false;
  }

  subscribeLog (id, listner) {
    this.subscribe.push({id, func: listner});
  }

  deleteSubscribeLog (id) {
    const idx = this.subscribe.findIndex(s => s.id === id);
    if(idx < 0) return;
    this.subscribe.splice(idx, 1);
  }

  connect() {
    if(this.tail) this.tail.watch();
    this.status = true;

    this.tail = new Tail(this.file, {
      nLines: 10
      // useWatchFile: true
    });

    this.tail.on("line", (data) => {
      const out = data+'\n';
      // const arr = out.split(/\n/);
      this.logs.shift();
      this.logs.push(out);
      this.subscribe.forEach(({func}) => {
        func(out, this.logs);
      });
    });

    this.tail.on("error", (error) => {
      console.log('ERROR: ', error);
      this.tail.unwatch()
      this.status = false;
    });
  }
}