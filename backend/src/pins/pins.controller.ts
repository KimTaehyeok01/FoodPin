import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PinsService } from './pins.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePinDto } from './dto/create-pin.dto';
import { UpdatePinDto } from './dto/update-pin.dto';

@Controller('pins')
@UseGuards(JwtAuthGuard)
export class PinsController {
  constructor(private readonly pinsService: PinsService) {}

  @Get('me')
  getMyPins(@Req() req: any) {
    return this.pinsService.getMyPins(req.user.id);
  }

  @Get('restaurant/:restaurantId')
  getRestaurantPins(@Param('restaurantId', ParseIntPipe) restaurantId: number) {
    return this.pinsService.getRestaurantPins(restaurantId);
  }

  @Post(':restaurantId')
  pin(
    @Req() req: any,
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Body() dto: CreatePinDto,
  ) {
    return this.pinsService.pin(req.user.id, restaurantId, dto);
  }

  @Patch(':restaurantId')
  updatePin(
    @Req() req: any,
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Body() dto: UpdatePinDto,
  ) {
    return this.pinsService.updatePin(req.user.id, restaurantId, dto);
  }

  @Delete(':restaurantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  unpin(
    @Req() req: any,
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
  ) {
    return this.pinsService.unpin(req.user.id, restaurantId);
  }
}
