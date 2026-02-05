import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { UsersService } from './users/users.service';
import { User, UserSchema } from './users/schemas/user.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      ignoreEnvFile: false,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI, {
      retryWrites: true,
      w: 'majority',
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    UsersModule,
    AuthModule,
    HealthModule,
  ],
  providers: [UsersService],
})
export class AppModule implements OnModuleInit {
  constructor(private usersService: UsersService) {}

  async onModuleInit() {
    try {
      const count = await this.usersService.count();
      if (count === 0) {
        console.log('🔄 Database is empty. Starting seed process...');
        console.log('⏳ This may take several minutes...');
        this.usersService.seedDatabase().catch((error) => {
          console.error('❌ Error seeding database:', error);
        });
      } else {
        console.log(`✅ Database contains ${count} users`);
      }
    } catch (error) {
      console.error('Error checking database:', error);
    }
  }
}
