// Typed event bus for real-time agent updates
// Bridges backend agent activity to the dashboard

import { EventEmitter } from "events";

export interface AgentEventData {
    type: string;
    data: Record<string, unknown>;
    timestamp: string;
}

// Global event bus singleton — shared between agent and API routes
class AgentEventBus extends EventEmitter {
    private recentEvents: AgentEventData[] = [];
    private maxEvents = 200;

    emit(event: string, data?: Record<string, unknown>): boolean {
        const eventData: AgentEventData = {
            type: event,
            data: data || {},
            timestamp: new Date().toISOString(),
        };

        this.recentEvents.push(eventData);
        if (this.recentEvents.length > this.maxEvents) {
            this.recentEvents = this.recentEvents.slice(-this.maxEvents);
        }

        return super.emit("agent-event", eventData);
    }

    getRecentEvents(count: number = 50): AgentEventData[] {
        return this.recentEvents.slice(-count);
    }

    clearEvents(): void {
        this.recentEvents = [];
    }
}

// Singleton instance
export const eventBus = new AgentEventBus();
