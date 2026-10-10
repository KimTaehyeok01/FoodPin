// 핀(별점·메모) API 엔드포인트 — 전 핸들러 인증 필요
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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PinsService } from './pins.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePinDto } from './dto/create-pin.dto';
import { UpdatePinDto } from './dto/update-pin.dto';
import {
  MyPinResponse,
  PinResponse,
  RestaurantPinResponse,
} from './dto/pin.response.dto';
import { AuthRequest } from '../common/types/auth-request';
import { ApiErrorResponses } from '../common/swagger/api-error-responses.decorator';

@ApiTags('4.핀')
@ApiBearerAuth()
@Controller('pins')
@UseGuards(JwtAuthGuard)
export class PinsController {
  constructor(private readonly pinsService: PinsService) {}

  @Get('me')
  @ApiOperation({ summary: '내가 핀한 식당 목록 조회 (식당 정보 포함)' })
  @ApiOkResponse({ type: [MyPinResponse] })
  @ApiErrorResponses(401)
  getMyPins(@Req() req: AuthRequest): Promise<MyPinResponse[]> {
    return this.pinsService.getMyPins(req.user.id);
  }

  @Get('restaurant/:restaurantId')
  @ApiOperation({ summary: '식당별 핀(리뷰) 목록 조회 (작성자 정보 포함)' })
  @ApiOkResponse({ type: [RestaurantPinResponse] })
  @ApiErrorResponses(401)
  getRestaurantPins(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
  ): Promise<RestaurantPinResponse[]> {
    return this.pinsService.getRestaurantPins(restaurantId);
  }

  @Post(':restaurantId')
  @ApiOperation({ summary: '식당에 핀 등록' })
  @ApiCreatedResponse({ type: PinResponse })
  @ApiErrorResponses(400, 401, 404, 409)
  pin(
    @Req() req: AuthRequest,
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Body() dto: CreatePinDto,
  ): Promise<PinResponse> {
    return this.pinsService.pin(req.user.id, restaurantId, dto);
  }

  @Patch(':restaurantId')
  @ApiOperation({ summary: '내 핀 수정 (별점·메모)' })
  @ApiOkResponse({ type: PinResponse })
  @ApiErrorResponses(400, 401, 404)
  updatePin(
    @Req() req: AuthRequest,
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Body() dto: UpdatePinDto,
  ): Promise<PinResponse> {
    return this.pinsService.updatePin(req.user.id, restaurantId, dto);
  }

  @Delete(':restaurantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '내 핀 삭제' })
  @ApiNoContentResponse({ description: '삭제 성공 (본문 없음)' })
  @ApiErrorResponses(401, 404)
  unpin(
    @Req() req: AuthRequest,
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
  ): Promise<void> {
    return this.pinsService.unpin(req.user.id, restaurantId);
  }
}
