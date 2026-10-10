// 식당 API 엔드포인트 — 목록·상세는 공개, 등록·수정·삭제는 인증 필요
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import {
  RestaurantDetailResponse,
  RestaurantResponse,
} from './dto/restaurant.response.dto';
import { AuthRequest } from '../common/types/auth-request';
import { ApiErrorResponses } from '../common/swagger/api-error-responses.decorator';

// 목록·상세는 비로그인 사용자도 지도를 볼 수 있어야 하므로 공개 엔드포인트다.
// Guard와 @ApiBearerAuth를 클래스 레벨로 올리면 GET 두 개가 401이 된다 — 반드시 메서드 레벨로 유지한다.
@ApiTags('3.식당')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  @ApiOperation({ summary: '식당 목록 조회 (인증 불요)' })
  @ApiOkResponse({ type: [RestaurantResponse] })
  findAll(): Promise<RestaurantResponse[]> {
    return this.restaurantsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '식당 상세 조회 (메뉴 포함, 인증 불요)' })
  @ApiOkResponse({ type: RestaurantDetailResponse })
  @ApiErrorResponses(404)
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RestaurantDetailResponse> {
    return this.restaurantsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '식당 등록' })
  @ApiCreatedResponse({ type: RestaurantResponse })
  @ApiErrorResponses(400, 401)
  create(
    @Body() dto: CreateRestaurantDto,
    @Req() req: AuthRequest,
  ): Promise<RestaurantResponse> {
    return this.restaurantsService.create(dto, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '식당 수정 (소유자 본인, 시드 식당은 관리자만)' })
  @ApiOkResponse({ type: RestaurantDetailResponse })
  @ApiErrorResponses(400, 401, 403, 404)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRestaurantDto,
    @Req() req: AuthRequest,
  ): Promise<RestaurantDetailResponse> {
    return this.restaurantsService.update(id, req.user, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '식당 삭제 (소유자 본인, 시드 식당은 관리자만)' })
  @ApiNoContentResponse({ description: '삭제 성공 (본문 없음)' })
  @ApiErrorResponses(401, 403, 404)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthRequest,
  ): Promise<void> {
    return this.restaurantsService.remove(id, req.user);
  }
}
