import Router from 'koa-router';
import InstanceRouter from './instance';
import logRouter from './log';
import ServiceRouter from './service';

const ApiRouter = new Router();

ApiRouter.use('/instance', InstanceRouter.routes());
ApiRouter.use('/log', logRouter.routes());
ApiRouter.use('/service', ServiceRouter.routes());

export default ApiRouter;