import { EntityManager } from '@mikro-orm/mysql'
import { Body, Controller, Get, Post, Put, UnauthorizedException } from '@nestjs/common'
import { LoginId, StpUtil, TokenValue, XltCheckLogin } from '@xlt-token/nestjs'
import { compare, hash } from 'bcryptjs'
import { User } from '../entities'
import { ChangePasswordDto, LoginDto, UpdateProfileDto } from './auth.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly em: EntityManager) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.em.findOne(User, { username: dto.username })
    if (!user || !(await compare(dto.password, user.password))) {
      throw new UnauthorizedException('用户名或密码错误')
    }
    const token = await StpUtil.login(user.id, { device: 'web' })
    return { token, user }
  }

  @XltCheckLogin()
  @Post('logout')
  async logout(@TokenValue() token: string) {
    await StpUtil.logout(token)
    return null
  }

  @XltCheckLogin()
  @Get('me')
  async me(@LoginId() loginId: string) {
    const user = await this.em.findOne(User, { id: Number(loginId) })
    if (!user) {
      throw new UnauthorizedException('登录已失效，请重新登录')
    }
    return user
  }

  @XltCheckLogin()
  @Put('profile')
  async updateProfile(@LoginId() loginId: string, @Body() dto: UpdateProfileDto) {
    const user = await this.em.findOneOrFail(User, { id: Number(loginId) })
    if (dto.nickname !== undefined) user.nickname = dto.nickname
    if (dto.avatar !== undefined) user.avatar = dto.avatar
    await this.em.flush()
    return user
  }

  @XltCheckLogin()
  @Put('password')
  async changePassword(@LoginId() loginId: string, @Body() dto: ChangePasswordDto) {
    const user = await this.em.findOneOrFail(User, { id: Number(loginId) })
    if (!(await compare(dto.oldPassword, user.password))) {
      throw new UnauthorizedException('原密码错误')
    }
    user.password = await hash(dto.newPassword, 10)
    await this.em.flush()
    // 修改密码后强制下线，需重新登录
    await StpUtil.logoutByLoginId(String(user.id))
    return null
  }
}
