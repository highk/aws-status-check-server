import Router from '@koa/router';

const InstanceRouter = new Router();

InstanceRouter.get('/', async ctx => {
  ctx.body =
  //  ctx.serverManager.servers;
  {
    instances: ctx.serverManager.servers,
    targetGroups: ctx.serverManager.targetGroups
  }
});

export default InstanceRouter;