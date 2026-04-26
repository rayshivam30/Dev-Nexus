import { EventEmitter } from 'events';

// Create a global emitter for system-wide events
const globalForEmitter = globalThis as unknown as { eventEmitter: EventEmitter };

export const eventEmitter = globalForEmitter.eventEmitter || new EventEmitter();

if (process.env.NODE_ENV !== 'production') globalForEmitter.eventEmitter = eventEmitter;

export const EVENTS = {
  INCIDENT_CREATED: 'incident:created',
  INCIDENT_UPDATED: 'incident:updated',
  INCIDENT_ASSIGNED: 'incident:assigned',
  COMMENT_ADDED: 'incident:comment_added',
  SLA_BREACHED: 'incident:sla_breach',
};
