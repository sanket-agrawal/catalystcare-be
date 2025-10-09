import bcrypt from "bcryptjs";

/**
 * Hash a plain text password
 */
export const hashPassword = async (password : string) => {
  const saltRounds = 12; // higher = more secure but slower
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare a plain text password with a hash
 */
export const comparePassword = async (password : string, hashed: string) => {
  return await bcrypt.compare(password, hashed);
};
