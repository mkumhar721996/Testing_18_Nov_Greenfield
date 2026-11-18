import { SetMetadata } from '@nestjs/common';

// ADR-0010 roles.
export type Role = 'employee' | 'manager' | 'hr_admin';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
