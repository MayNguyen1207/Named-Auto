export type InvalidLoginData = {
  scenario: string;
  email: string;
  password: string;
  expectedErrorMsg: string;
};

export type RecaptchaData = {
  email: string;
  password: string;
  text: string;
  attempts: number;
};

const randomDomains = ['yopmail.com', 'gmail.com', 'hotmail.com', 'outlook.com', 'example.com'];

function getRandomDomain(): string {
  return randomDomains[Math.floor(Math.random() * randomDomains.length)];
}

const firstNames = ['john', 'jane', 'alex', 'maria', 'david', 'lina', 'tom', 'sara', 'mike', 'anna'];
const lastNames = ['smith', 'lee', 'kim', 'park', 'choi', 'nguyen', 'johnson', 'brown', 'miller', 'garcia'];

function getRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function getRandomLocalPart(): string {
  const firstName = getRandomItem(firstNames);
  const lastName = getRandomItem(lastNames);
  const numberSuffix = `${Math.floor(10 + Math.random() * 990)}`;
  return `${firstName}_${lastName}${numberSuffix}`;
}

function getUniqueEmail(baseEmail: string): string {
  const domain = getRandomDomain();
  const randomLocalPart = getRandomLocalPart();

  return `${randomLocalPart}@${domain}`;
}

export function buildInvalidLoginData(items: InvalidLoginData[]): InvalidLoginData[] {
  return items.map((item) => ({
    ...item,
    email: getUniqueEmail(item.email),
  }));
}

export function buildRecaptchaData(data: RecaptchaData): RecaptchaData {
  return {
    ...data,
    email: getUniqueEmail(data.email),
  };
}
