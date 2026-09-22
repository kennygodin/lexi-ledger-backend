import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository, CreateUserInput } from './users.repository';
import { User } from '../../generated/prisma/client';
import { USERS_MESSAGES } from './users.constants';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getMe(id: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException(USERS_MESSAGES.USER_NOT_FOUND);
    return this.toSafeUser(user);
  }

  async updateName(id: string, name: string) {
    const user = await this.usersRepository.updateName(id, name);
    return this.toSafeUser(user);
  }

  private toSafeUser(user: User) {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }

  markEmailAsVerified(id: string): Promise<User> {
    return this.usersRepository.markEmailVerified(id);
  }

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
