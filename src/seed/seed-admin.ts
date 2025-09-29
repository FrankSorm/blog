// import 'dotenv/config'; // nahraje .env před AppModule
// import { NestFactory } from '@nestjs/core';
// import { AppModule } from '../app.module';
// import { getModelToken } from '@nestjs/mongoose';
// import { User } from '../users/schemas/user.schema';
// import * as bcrypt from 'bcrypt';
// async function bootstrap() {
//   const app = await NestFactory.createApplicationContext(AppModule);
//   const userModel = app.get(getModelToken(User.name));
//   const email = process.env.ADMIN_EMAIL || 'admin@example.com';
//   const pass = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
//   const exists = await userModel.exists({ email });
//   if (exists) { console.log('Admin already exists ->', email); }
//   else {
//     await userModel.create({ email, name: 'Admin', password: await bcrypt.hash(pass, 10), role: 'admin' });
//     console.log('Admin created ->', email);
//   }
//   await app.close();
// }
// bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../users/schemas/user.schema';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const cfg = app.get(ConfigService);
  const email = cfg.get<string>('ADMIN_EMAIL', 'admin@example.com');
  const pass = cfg.get<string>('ADMIN_PASSWORD', 'ChangeMe123!');
  const userModel = app.get(getModelToken(User.name));

  const exists = await userModel.exists({ email });
  if (exists) {
    console.log(`Admin already exists: ${email}`);
  } else {
    await userModel.create({
      email,
      name: 'Admin',
      password: await bcrypt.hash(pass, 10),
      role: 'admin',
    });
    console.log(`Admin created: ${email}`);
  }

  await app.close();
}
bootstrap();