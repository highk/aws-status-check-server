import Router from '@koa/router';

const logRouter = new Router();

logRouter.get('/', async ctx => {
  ctx.body =
  //  ctx.serverManager.servers;
  {
    instances: ctx.serverManager.servers,
    targetGroups: ctx.serverManager.targetGroups
  }
});

export default logRouter;