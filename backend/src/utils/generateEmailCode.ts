import { v4 as uuidv4 } from 'uuid';
import bs58 from 'bs58';

export function generateBase58Uuid(): string {
  const uuid = uuidv4();
  const uuidBytes = Buffer.from(uuid.replace(/-/g, ''), 'hex');
  return bs58.encode(uuidBytes);
}
