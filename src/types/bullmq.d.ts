declare module 'bullmq' {
  export class Queue {
    constructor(name: string, options?: any);
    add(name: string, data: any, options?: any): Promise<any>;
  }
  export class Worker {
    constructor(name: string, processor: (job: Job) => Promise<any>, options?: any);
    on(event: string, handler: (...args: any[]) => void): this;
  }
  export interface Job {
    id?: string;
    data: any;
    returnvalue: any;
  }
}
