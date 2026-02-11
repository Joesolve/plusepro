import { Module } from '@nestjs/common';
import { RecognitionsService } from './recognitions.service';
import { RecognitionsController } from './recognitions.controller';
@Module({ controllers: [RecognitionsController], providers: [RecognitionsService], exports: [RecognitionsService] })
export class RecognitionsModule {}
