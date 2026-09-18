import { Injectable } from '@nestjs/common';
import { UsersRepository, CreateUserInput } from './users.repository';
import { User } from '../../generated/prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  updatePassword(id: string, passwordHash: string): Promise<User> {
    return this.usersRepository.updatePassword(id, passwordHash);
  }

  create(data: CreateUserInput): Promise<User> {
    return this.usersRepository.createUser(data);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }
}
