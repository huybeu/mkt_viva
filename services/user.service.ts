import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
export class UserService { list() { return db.user.findMany({ orderBy: { name: "asc" } }); } create(data: Prisma.UserCreateInput) { return db.user.create({ data }); } update(id: string, data: Prisma.UserUpdateInput) { return db.user.update({ where: { id }, data }); } }
export const users = new UserService();
