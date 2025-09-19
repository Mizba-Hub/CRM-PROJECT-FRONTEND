import bcrypt from "bcryptjs";

type User = {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
};

const mem = { users: [] as User[] };

export async function createUser(d: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  if (mem.users.find((u) => u.email === d.email)) {
    return { error: "Email already registered" };
  }

  mem.users.push({
    id: `u${mem.users.length + 1}`,
    email: d.email,
    passwordHash: bcrypt.hashSync(d.password, 10),
    firstName: d.firstName,
    lastName: d.lastName,
  });

  return { ok: true };
}

export async function findUserByEmail(email: string) {
  return mem.users.find((u) => u.email === email) ?? null;
}
