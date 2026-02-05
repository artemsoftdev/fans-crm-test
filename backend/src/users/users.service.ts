import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { faker } from '@faker-js/faker';
import { faker as fakerUk } from '@faker-js/faker/locale/uk';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = new this.userModel({
      ...createUserDto,
      birthdate: createUserDto.birthdate
        ? new Date(createUserDto.birthdate)
        : new Date(),
    });

    const savedUser = await user.save();
    return savedUser;
  }

  async findAll(query: GetUsersQueryDto) {
    const { page = 1, limit = 10, name, email, phone } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }
    if (email) {
      filter.email = { $regex: email, $options: 'i' };
    }
    if (phone) {
      filter.phone = { $regex: phone, $options: 'i' };
    }

    const [data, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ _id: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<User | null> {
    return this.userModel.findById(id).lean().exec();
  }

  async count(): Promise<number> {
    return this.userModel.countDocuments().exec();
  }

  async seedDatabase(): Promise<void> {
    const count = await this.count();

    if (count > 0) {
      this.logger.log(
        `✅ Database already contains ${count} users. Skipping seed.`,
      );
      return;
    }

    this.logger.log('📦 Database is empty. Generating 2,000,000 users...');
    this.logger.log('⏳ This may take several minutes...');

    const batchSize = 10000;
    const totalUsers = 2000000;
    let processed = 0;

    for (let i = 0; i < totalUsers; i += batchSize) {
      const batch = [];
      const currentBatchSize = Math.min(batchSize, totalUsers - i);

      for (let j = 0; j < currentBatchSize; j++) {
        const firstName = fakerUk.person.firstName();
        const lastName = fakerUk.person.lastName();
        const name = `${firstName} ${lastName}`;

        const phoneCodes = [
          '050',
          '063',
          '067',
          '068',
          '073',
          '091',
          '092',
          '093',
          '094',
          '095',
          '096',
          '097',
          '098',
          '099',
        ];
        const phoneCode =
          phoneCodes[Math.floor(Math.random() * phoneCodes.length)];
        const phoneNumber = faker.string.numeric(7);
        const phone = `+380${phoneCode}${phoneNumber}`;

        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000000);
        const email =
          `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${timestamp}_${random}_${i}_${j}@${faker.internet.domainName()}`.toLowerCase();

        batch.push({
          name,
          email,
          phone,
          birthdate: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
        });
      }

      try {
        await this.userModel.insertMany(batch, { ordered: false });
      } catch (insertError: any) {
        if (
          insertError.code === 11000 ||
          insertError.name === 'BulkWriteError'
        ) {
          this.logger.warn(
            `⚠️ Some duplicates found in batch ${i / batchSize + 1}, inserting individually...`,
          );
          let successCount = 0;
          for (const user of batch) {
            try {
              await this.userModel.create(user);
              successCount++;
            } catch (err: any) {
              if (err.code !== 11000) {
                this.logger.error('Error inserting user:', err.message);
              }
            }
          }
          this.logger.log(
            `✅ Inserted ${successCount}/${batch.length} users from batch ${i / batchSize + 1}`,
          );
        } else {
          throw insertError;
        }
      }

      processed += currentBatchSize;
      const percentage = ((processed / totalUsers) * 100).toFixed(2);
      this.logger.log(
        `📊 Progress: ${processed}/${totalUsers} (${percentage}%)`,
      );
    }

    const finalCount = await this.count();
    this.logger.log(`✅ Successfully seeded ${finalCount} users!`);
  }
}
