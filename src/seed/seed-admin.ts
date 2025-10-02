import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';

async function bootstrap(tenantKey: string = 'default') {
  const app = await NestFactory.createApplicationContext(AppModule);
  const users = app.get(UsersService);
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const pass = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const name = process.env.ADMIN_NAME || 'Admin';
  const list = await users.list(tenantKey);
  const exists = list.find((u) => u.email === email);
  if (exists) {
    console.log('Admin already exists ->', email);
  } else {
    await users.createByAdmin({ email, name, password: pass, role: 'admin' }, tenantKey);
    console.log('Admin created ->', email);
  }
  await app.close();
}
bootstrap();
