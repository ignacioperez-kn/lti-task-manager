
export class LtiClaims {
  constructor(private payload: any) {}

  private getClaim(key: string): any {
    return this.payload[key];
  }

  public getSub(): string {
    return this.getClaim('sub');
  }

  public getRoles(): string[] {
    const roles = this.getClaim('https://purl.imsglobal.org/spec/lti/claim/roles');
    return Array.isArray(roles) ? roles : [];
  }

  public getContextId(): string {
    const context = this.getClaim('https://purl.imsglobal.org/spec/lti/claim/context');
    return context?.id || '';
  }

  public getDeploymentId(): string {
    return this.getClaim('https://purl.imsglobal.org/spec/lti/claim/deployment_id');
  }

  public getName(): string | undefined {
    const givenName = this.getClaim('given_name');
    const familyName = this.getClaim('family_name');
    if (givenName && familyName) {
      return `${givenName} ${familyName}`;
    }
    return this.getClaim('name');
  }

  public getEmail(): string | undefined {
    return this.getClaim('email');
  }

  public getCustomParameters(): Record<string, string> {
    return this.getClaim('https://purl.imsglobal.org/spec/lti/claim/custom') || {};
  }

  public isInstructor(): boolean {
    const roles = this.getRoles();
    return roles.some(role => 
      role.includes('http://purl.imsglobal.org/vocab/lis/v2/institution/person#Instructor') ||
      role.includes('http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor')
    );
  }

  public isLearner(): boolean {
    const roles = this.getRoles();
    return roles.some(role => 
      role.includes('http://purl.imsglobal.org/vocab/lis/v2/institution/person#Learner') ||
      role.includes('http://purl.imsglobal.org/vocab/lis/v2/membership#Learner')
    );
  }

  public isDeepLinkingRequest(): boolean {
    return this.getClaim('https://purl.imsglobal.org/spec/lti/claim/message_type') === 'LtiDeepLinkingRequest';
  }

  public getDeepLinkingSettings(): any {
    return this.getClaim('https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings');
  }
}
