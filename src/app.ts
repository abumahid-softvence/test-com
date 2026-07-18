import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { httpLogger } from './config/logger';
import { router } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { NotFoundError } from './shared/errors';

const app = express();

app.use(httpLogger);
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

app.use(router);

app.use((_req, _res, next) => {
  next(new NotFoundError('Route not found'));
});

app.use(errorHandler);

export { app };
