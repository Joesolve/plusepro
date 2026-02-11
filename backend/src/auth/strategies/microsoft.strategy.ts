import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(
    config: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: config.get<string>('MICROSOFT_CLIENT_ID'),
      clientSecret: config.get<string>('MICROSOFT_CLIENT_SECRET'),
      callbackURL: `${config.get<string>('API_URL')}/api/auth/microsoft/callback`,
      scope: ['user.read'],
      tenant: 'common',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ) {
    const user = await this.authService.validateOAuthUser({
      email: profile.emails[0].value,
      firstName: profile.name.givenName || profile.displayName,
      lastName: profile.name.familyName || '',
      provider: 'microsoft',
      providerAccountId: profile.id,
      accessToken,
      refreshToken,
    });
    done(null, user);
  }
}
