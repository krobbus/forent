import express from 'express';
import { attachDatabase } from '../database/pool.js';
import applicationsRouter from './applications.js';
import authRouter from './auth.js';
import maintenanceRouter from './maintenance.js';
import paymentRouter from './payment.js';
import profileRouter from './profile.js';
import propertiesRouter from './properties.js';
import usersRouter from './users.js';

const apiRouter = express.Router();

apiRouter.use(attachDatabase);
apiRouter.use('/', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/', profileRouter);
apiRouter.use('/properties', propertiesRouter);
apiRouter.use('/applications', applicationsRouter);
apiRouter.use('/maintenance', maintenanceRouter);
apiRouter.use('/payment', paymentRouter);

export default apiRouter;