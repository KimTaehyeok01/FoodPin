import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pin } from './pin.entity';
import { PinsController } from './pins.controller';
import { PinsService } from './pins.service';

@Module({
  imports: [TypeOrmModule.forFeature([Pin])],
  controllers: [PinsController],
  providers: [PinsService],
  exports: [PinsService],
})
export class PinsModule {}
