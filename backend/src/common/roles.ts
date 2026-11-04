export const CERTIFICATE_ISSUER_ROLES = [
  'HIGH_MANAGEMENT',
  'QUALITY',
  'OPERATIONS_MANAGEMENT',
  'MARKETING_MANAGEMENT',
] as const;

export type SentinelRole =
  | 'ADMIN'
  | 'TECHNICIAN'
  | 'CLIENT'
  | typeof CERTIFICATE_ISSUER_ROLES[number];

export function canIssueCertificate(role: SentinelRole): boolean {
  return (CERTIFICATE_ISSUER_ROLES as readonly string[]).includes(role);
}
