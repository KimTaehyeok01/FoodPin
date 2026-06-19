import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pin } from './pin.entity';
import { CreatePinDto } from './dto/create-pin.dto';

@Injectable()
export class PinsService {
  constructor(
    @InjectRepository(Pin)
    private readonly pinRepo: Repository<Pin>,
  ) {}

  async getMyPins(userId: number): Promise<Pin[]> {
    return this.pinRepo.find({
      where: { userId },
      relations: { restaurant: true },
      order: { createdAt: 'DESC' },
    });
  }

  async pin(userId: number, restaurantId: number, dto: CreatePinDto): Promise<Pin> {
    const exists = await this.pinRepo.findOne({ where: { userId, restaurantId } });
    if (exists) throw new ConflictException('이미 핀한 식당입니다.');

    const pin = this.pinRepo.create({ userId, restaurantId, ...dto });
    return this.pinRepo.save(pin);
  }

  async updatePin(userId: number, restaurantId: number, dto: Partial<CreatePinDto>): Promise<Pin> {
    const pin = await this.pinRepo.findOne({ where: { userId, restaurantId } });
    if (!pin) throw new NotFoundException('핀을 찾을 수 없습니다.');
    Object.assign(pin, dto);
    return this.pinRepo.save(pin);
  }

  async unpin(userId: number, restaurantId: number): Promise<void> {
    const pin = await this.pinRepo.findOne({ where: { userId, restaurantId } });
    if (!pin) throw new NotFoundException('핀을 찾을 수 없습니다.');
    await this.pinRepo.remove(pin);
  }

  async isPinned(userId: number, restaurantId: number): Promise<boolean> {
    const pin = await this.pinRepo.findOne({ where: { userId, restaurantId } });
    return !!pin;
  }
}
