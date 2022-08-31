import { RemoteLogReader } from '../../modules/remoteTail';
import Router from '@koa/router';
import { NodeSSH } from 'node-ssh';

const ServiceRouter = new Router();

ServiceRouter.post('/ovenmediaengine', async ctx => {
  console.log(ctx.request.body);
  if(!ctx.request.body.host) return;

  const logClient: RemoteLogReader|null = ctx.logManager.find(ctx.request.body.host);
  if(!logClient) return;

  const ssh = new NodeSSH()
  ssh.connect({
    host: logClient.host,
    username: logClient.user,
    privateKey: logClient.pemKey
  })
  .then(() => {
    ssh.execCommand('sudo systemctl restart ovenmediaengine.service')
    .then(function(result) {
      console.log('STDOUT: ' + result.stdout)
      console.log('STDERR: ' + result.stderr)

      ssh.dispose();
    });
  });

  return 'asdasd';
});

export default ServiceRouter;