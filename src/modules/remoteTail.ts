import 'dotenv/config';

import { NodeSSH, Config } from 'node-ssh';

export type ConnectMethod = "pemkey" | "password" | "none";

export interface RemoteLogReaderOption {
  file: string;
  user: string;
  host: string;
  port?: number;
  pemKey?: string;
  password?: string;
  connectMethod?: ConnectMethod;
}

export class RemoteLogReader {
  file: string;
  user: string;
  host: string;
  port?: number;
  pemKey?: string;
  password?: string;
  connectMethod?: ConnectMethod;
  ssh: NodeSSH | any;
  logs: string[];
  subscribe?: any[];
  status: boolean;

  constructor (option: RemoteLogReaderOption) {
    this.file = option.file;
    this.host = option.host;
    this.user = option.user;
    this.port = option.port || 22;
    this.pemKey = option.pemKey;
    this.password = option.password;
    this.connectMethod = option.connectMethod || "none";
    this.ssh = new NodeSSH();
    this.status = false;
    this.logs = [];
    this.subscribe = [];
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
    if(!this.host) throw("host is undefined");
    if(!this.user) throw("user is undefined");

    let sshConnectOption: Config = {
      host: this.host,
      username: this.user
    }

    switch (this.connectMethod){
      case "pemkey" :
        if(!this.pemKey) throw("pemKey is undefined");
        sshConnectOption.privateKey = this.pemKey;
        break;

      case "password":
        if(!this.password) throw("password is undefined");
        sshConnectOption.privateKey = this.password;
        break;

      case "none":
        break;

      default:
        throw("connectMethod Error")
    }
    
    this.ssh.connect(sshConnectOption)
    .then(() => {
      this.ssh.exec('tail', ['-f', this.file], {
        onStdout: (chunk) => {
          const out = chunk.toString('utf8');
          // const arr = out.split(/\n/);
          this.logs.shift();
          this.logs.push(out);
          this.subscribe.forEach(({func}) => {
            func(out, this.logs);
          });
          this.status = true;
        },
        onStderr: (chunk) => {
          console.log("ERROR", chunk.toString('utf8'))
        }
      })
      .catch((err) => {
        this.status = false;
      });
    })
    .catch(() => {
      this.status = false;
    });
  }
}


