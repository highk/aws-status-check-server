import { RemoteLogReader, RemoteLogReaderOption } from "../modules/remoteTail";
import 'dotenv/config'
import { LocalLogReader, LocalLogReaderOption } from "../modules/tail";


const remoteLogReaderOption: RemoteLogReaderOption = {
  host: '',
  connectMethod: 'pemkey',
  file: process.env.FILENAME,
  user: process.env.USER,
  pemKey: process.env.PEMKEY
}

export default class LogManager {
  remoteTails: RemoteLogReader[];
  constructor () {
    this.remoteTails = [];

    setInterval(() => {
      this.remoteTails.forEach(reader => {
        if(!reader.status) reader.connect();
      });
    }, 1000*60);
    
  }
  
  find(host: string) {
    const reader = this.remoteTails.find(r => r.host === host);
    if(reader) return reader;
    return null;
  }
  findIndex(host: string) {
    const idx = this.remoteTails.findIndex(r => r.host === host);
    if(idx > -1) return ({reader: this.remoteTails[idx], idx: null});
    return ({reader: null, idx: null});
  }

  add(host: string) {
    let reader = null;
    if(process.env.ORIGIN_IP === host) {
      const option: LocalLogReaderOption = {
        host: host,
        file: process.env.ORIGIN_FILENAME
      }
      reader = new LocalLogReader(option);
    }
    else {
      const option: RemoteLogReaderOption = {
        ...remoteLogReaderOption,
        host: host
      }
      reader = new RemoteLogReader(option);
    }

    reader.connect();
    this.remoteTails.push(reader);
    return reader;
  }

  addLogListener(host: string, id: any, cb: any) {
    const reader = this.find(host);
    if(!reader) return false;
    reader.subscribeLog(id, cb);
  }

  removeLogListener(host: string, id: any) {
    const reader = this.find(host);
    if(!reader) return false;
    reader.deleteSubscribeLog(id);
  }

  delete(host: string) {
    const { reader, idx } = this.findIndex(host);
    if(!reader) return false;
    reader.ssh.dispose();
    this.remoteTails.splice(idx, 1);
  }
}

