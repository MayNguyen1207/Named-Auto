import { randomInt, randomUUID } from 'node:crypto';

export type RegisterIdentity = { email: string; phone: string };

export function randomRegisterEmail(): string {
    return `autoreg${Date.now()}${randomUUID().replace(/-/g, '')}@gmail.com`;
}

// The dev form supplies the Korean prefix; only its remaining eight digits are entered.
export function randomRegisterPhone(): string {
    const remainingDigits = Array.from(
        { length: 8 },
        () => randomInt(0, 10)
    ).join('');

    return `1${remainingDigits}`;
}

export function buildRegisterIdentity(): RegisterIdentity {
    return { email: randomRegisterEmail(), phone: randomRegisterPhone() };
}
