class UsernameGenerator {
  private static instance: UsernameGenerator;
  private generatedNames: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): UsernameGenerator {
    if (!UsernameGenerator.instance) {
      UsernameGenerator.instance = new UsernameGenerator();
    }
    return UsernameGenerator.instance;
  }

  private generateRandomName(): string {
    const vowels = 'aeiou';
    const consonants = 'bcdfghjklmnpqrstvwxyz';
    const length = Math.floor(Math.random() * 4) + 4; // Random length between 4-7
    let name = '';
    
    for (let i = 0; i < length; i++) {
      if (i % 2 === 0) {
        name += consonants[Math.floor(Math.random() * consonants.length)];
      } else {
        name += vowels[Math.floor(Math.random() * vowels.length)];
      }
    }
    
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  public generateUniqueName(): string {
    let name: string;
    do {
      name = this.generateRandomName();
    } while (this.generatedNames.has(name));
    
    this.generatedNames.add(name);
    return name;
  }

  public releaseName(name: string): void {
    this.generatedNames.delete(name);
  }
}

export const usernameGenerator = UsernameGenerator.getInstance(); 