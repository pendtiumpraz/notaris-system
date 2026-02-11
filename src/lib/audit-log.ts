import { prisma } from '@/lib/prisma';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'STATUS_CHANGE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_RESET'
  | 'FILE_UPLOAD'
  | 'FILE_DELETE'
  | 'ASSIGN_STAFF'
  | 'SEND_MESSAGE';

export type AuditResourceType =
  | 'USER'
  | 'DOCUMENT'
  | 'APPOINTMENT'
  | 'BRANCH'
  | 'FILE'
  | 'MESSAGE'
  | 'CONVERSATION'
  | 'NOTIFICATION'
  | 'GALLERY';

interface AuditLogParams {
  userId: string;
  action: AuditAction;
  entityType: AuditResourceType;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog({
  userId,
  action,
  entityType,
  entityId,
  details,
  ipAddress,
}: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        user: { connect: { id: userId } },
        action,
        resourceType: entityType,
        resourceId: entityId || null,
        newValues: details ? JSON.parse(JSON.stringify(details)) : undefined,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    // Don't let audit logging failures break the main flow
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Helper to extract IP from request headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}
