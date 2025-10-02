import { Injectable } from '@nestjs/common';
import * as fs from 'fs';

export interface TenantsMap {
  [key: string]: any;
}

@Injectable()
export class TenantsStore {
  private tenants: TenantsMap = {};
  constructor() {
    const path = process.env.TENANTS_CONFIG || './tenants.json';
    if (fs.existsSync(path)) this.tenants = JSON.parse(fs.readFileSync(path, 'utf-8'));
  }
  get(key: string) {
    return this.tenants[key] || this.tenants['default'];
  }
}
