import express from 'express';
import { attachDatabase } from '../middleware/database.js';
import applicationsRouter from '../routes/applications.js';
import authRouter from '../routes/auth.js';
import maintenanceRouter from '../routes/maintenance.js';
import paymentRouter from '../routes/payment.js';
import profileRouter from '../routes/profile.js';
import propertiesRouter from '../routes/properties.js';
import usersRouter from '../routes/users.js';

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
