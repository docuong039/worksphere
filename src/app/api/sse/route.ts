/**
 * @file /api/sse/route.ts
 * @description SSE endpoint — giữ kết nối với từng client.
 *
 * GET /api/sse
 *   - Yêu cầu đăng nhập (401 nếu chưa)
 *   - Giữ connection mở vô thời hạn (stream không kết thúc)
 *   - Gửi heartbeat comment mỗi 25 giây để tránh proxy timeout
 *   - Đăng ký controller vào sseManager → sẵn sàng nhận push
 *   - Dọn dẹp khi client đóng tab / timeout
 *
 * Headers:
 *   Content-Type: text/event-stream
 *   Cache-Control: no-cache, no-transform
 *   X-Accel-Buffering: no   ← tắt buffer của nginx
 */

import { auth } from '@/lib/auth';
import { sseManager } from '@/lib/sse';
import type { SSEController } from '@/lib/sse';

// Bắt buộc chạy trên Node.js runtime (không phải edge)
// để dùng setInterval và ReadableStream controller
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HEARTBEAT_INTERVAL_MS = 25_000; // 25 giây

export async function GET() {
    // ── 1. Xác thực ────────────────────────────────────────────
    const session = await auth();

    if (!session?.user?.id) {
        return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const encoder = new TextEncoder();

    // ── 2. Tạo SSE stream ──────────────────────────────────────
    let controller!: SSEController;
    let heartbeat: ReturnType<typeof setInterval> | null = null;

    const stream = new ReadableStream<Uint8Array>({
        start(ctrl) {
            controller = ctrl;

            // Đăng ký vào global manager
            sseManager.addConnection(userId, controller);

            // Gửi event "connected" ngay khi kết nối thành công
            const connected =
                `event: connected\n` +
                `data: ${JSON.stringify({ userId, connectedAt: new Date().toISOString() })}\n\n`;
            controller.enqueue(encoder.encode(connected));

            // Heartbeat: gửi SSE comment mỗi 25s để giữ kết nối qua load balancer / nginx
            // SSE comment bắt đầu bằng ':' không được parse là event
            heartbeat = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(': heartbeat\n\n'));
                } catch {
                    // Stream đã đóng, dọn dẹp interval
                    if (heartbeat) clearInterval(heartbeat);
                }
            }, HEARTBEAT_INTERVAL_MS);
        },

        cancel() {
            // Được gọi khi client đóng tab, network ngắt, hoặc component unmount
            if (heartbeat) clearInterval(heartbeat);
            sseManager.removeConnection(userId, controller);
        },
    });

    // ── 3. Trả về SSE response ─────────────────────────────────
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            // Tắt buffering của Nginx / proxy — cực kỳ quan trọng!
            'X-Accel-Buffering': 'no',
        },
    });
}
