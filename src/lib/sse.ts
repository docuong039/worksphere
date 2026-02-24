/**
 * @file sse.ts
 * @description Global SSE (Server-Sent Events) Connection Manager.
 *
 * Quản lý tập trung tất cả kết nối SSE đang mở.
 * Mỗi user có thể mở nhiều tab → dùng Set<controller> cho mỗi userId.
 *
 * Pattern Singleton: instance được giữ trong `globalThis` để survive
 * qua các hot-reload trong development mà không bị reset.
 *
 * @example
 * // Push notification tới user
 * sseManager.emit(userId, 'notification', { id, title, message });
 *
 * // Kiểm tra user có đang online không
 * sseManager.isConnected(userId); // → true / false
 */

export type SSEController = ReadableStreamDefaultController<Uint8Array>;

export interface SSEEvent {
    type: string;
    title: string;
    message: string;
    id?: string;
    metadata?: Record<string, string>;
    createdAt?: string;
    isRead?: boolean;
}

class SSEManager {
    /** Map: userId → Set of open stream controllers (multiple tabs per user) */
    private connections = new Map<string, Set<SSEController>>();
    private encoder = new TextEncoder();

    /**
     * Đăng ký một kết nối SSE mới cho user.
     * Gọi khi một tab mới mở connection tới /api/sse.
     */
    addConnection(userId: string, controller: SSEController): void {
        if (!this.connections.has(userId)) {
            this.connections.set(userId, new Set());
        }
        this.connections.get(userId)!.add(controller);
    }

    /**
     * Hủy đăng ký kết nối khi tab đóng hoặc user disconnect.
     */
    removeConnection(userId: string, controller: SSEController): void {
        const controllers = this.connections.get(userId);
        if (!controllers) return;

        controllers.delete(controller);
        if (controllers.size === 0) {
            this.connections.delete(userId);
        }
    }

    /**
     * Gửi SSE event tới tất cả tab đang mở của một user.
     * Tự động dọn dẹp các controller đã đóng.
     *
     * @param userId   - ID của người nhận
     * @param event    - Tên event (e.g. 'notification', 'ping')
     * @param data     - Payload bất kỳ, sẽ được JSON.stringify
     */
    emit(userId: string, event: string, data: unknown): void {
        const controllers = this.connections.get(userId);
        if (!controllers || controllers.size === 0) return;

        // Format theo SSE spec: "event: name\ndata: json\n\n"
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        const encoded = this.encoder.encode(message);

        const deadControllers: SSEController[] = [];

        for (const controller of controllers) {
            try {
                controller.enqueue(encoded);
            } catch {
                // Controller đã đóng (tab đã rời đi trước khi cancel được gọi)
                deadControllers.push(controller);
            }
        }

        // Dọn dẹp các controller chết
        for (const dead of deadControllers) {
            controllers.delete(dead);
        }
        if (controllers.size === 0) {
            this.connections.delete(userId);
        }
    }

    /**
     * Gửi SSE event tới nhiều users cùng lúc.
     * Dùng sau createNotifications() bulk.
     */
    emitToMany(userIds: string[], event: string, data: unknown): void {
        for (const userId of userIds) {
            this.emit(userId, event, data);
        }
    }

    /**
     * Kiểm tra xem user có đang có ít nhất 1 tab kết nối không.
     */
    isConnected(userId: string): boolean {
        return (this.connections.get(userId)?.size ?? 0) > 0;
    }

    /**
     * Số lượng tab đang mở của user.
     */
    getConnectionCount(userId: string): number {
        return this.connections.get(userId)?.size ?? 0;
    }

    /**
     * Tổng số users đang connected (dùng cho monitoring/debug).
     */
    getTotalConnectedUsers(): number {
        return this.connections.size;
    }
}

// ─────────────────────────────────────────────
// Singleton pattern: tồn tại trong globalThis
// để không bị reset khi Next.js hot-reload các module
// ─────────────────────────────────────────────
declare global {
    // eslint-disable-next-line no-var
    var __sseManager: SSEManager | undefined;
}

export const sseManager: SSEManager =
    globalThis.__sseManager ?? (globalThis.__sseManager = new SSEManager());
