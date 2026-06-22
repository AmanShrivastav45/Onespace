import { createResourceApi } from './resourceApi';
import type { MiscTask, Status } from '../types/resources';

export interface MiscTaskCreate {
  title: string;
  description?: string;
  status?: Status;
}

export interface MiscTaskUpdate {
  title: string;
  description: string;
  status: Status;
}

export const miscApi = createResourceApi<MiscTask, MiscTaskCreate, MiscTaskUpdate>('/misc');
