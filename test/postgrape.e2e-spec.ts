import { Test } from '@nestjs/testing';
import * as dotenv from 'dotenv';
import { Entity, Repository } from '../src/repositories';
import { BaseDataClient } from '../src/data-client';
import { DataProvider, PostgrapeModule } from '../src';
import { Duration } from 'luxon';
import { DurationWithTZ } from '../src/duration-with-tz';
dotenv.config();

export type Bit = '0' | '1';
export type BitWeek = `${Bit}${Bit}${Bit}${Bit}${Bit}${Bit}${Bit}`

export enum WarehouseStatus {
  OnReview = 0,
}

/**
 * Entity interface that represents warehouse.
 */
export interface Warehouse extends Entity {
  name: string;
  address: string;
  lat: number;
  lng: number;
  opening_time: Duration;
  closing_time: DurationWithTZ;
  opening_days?: BitWeek;
  day_throughput: number;
  is_generic: boolean;
  status: WarehouseStatus;
  road_terminal_id?: number;
  water_terminal_id?: number;
  railway_terminal_id?: number;
  airport_terminal_id?: number;
  border_terminal_id?: number;
}

class TestDataClient extends BaseDataClient {
  public warehouses = new Repository<Warehouse>({ table: 'warehouse', schema: 'warehouse' }, this._config);
}

describe('PostgrapeModule', () => {
  let provider: DataProvider;

  describe('DataProvider', () => {
    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          PostgrapeModule.register({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            dataClient: TestDataClient
          }),
        ],
      }).compile();

      provider = moduleRef.get<DataProvider>(DataProvider);
    });

    it('should get data from database', async () => {
      const client = await provider.getClientAndBegin<TestDataClient>();

      const w = await client.warehouses.create({
        address: "вул. Каштанова, 1, смт Слобожанське, Dnipro, Dnipropetrovsk Oblast, Ukraine, 52005", 
        day_throughput: 1, 
        is_generic: false, 
        lat: 48.5553409, 
        lng: 35.0926967, 
        name: "ATB Market Warehouse", 
        opening_days: "0000000", 
        opening_time: Duration.fromObject({ hours: 8 }),
        closing_time: new DurationWithTZ('11:22:33-02:00'), 
        status: 0, 
      });
      
      client.commit();
      //client.release();
      await provider.end();

      console.log(String(w.opening_time));
      console.log(String(w.closing_time));
      expect(w).toBeTruthy()
    });
  });
});