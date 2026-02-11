import { IsString, IsOptional, IsUrl, Matches, IsEmail, MinLength } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  name: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must be lowercase alphanumeric with hyphens' })
  slug: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  // Admin user fields
  @IsEmail()
  adminEmail: string;

  @IsString()
  adminFirstName: string;

  @IsString()
  adminLastName: string;

  @IsString()
  @MinLength(8)
  adminPassword: string;
}
