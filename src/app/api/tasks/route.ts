import { successResponse, errorResponse } from '@/lib/api-error';
import { createTaskSchema } from '@/lib/validations';
import { withAuth } from '@/server/middleware/withAuth';
import { TaskServerService } from '@/server/services/task.server';

// ==========================================
// GET /api/tasks
// List tasks with strict permission filtering
// ==========================================
export const GET = withAuth(async (req, user) => {
    try {
        const { searchParams } = new URL(req.url);
        const result = await TaskServerService.getTasks(user, searchParams);
        return successResponse(result);
    } catch (error: any) {
        return errorResponse(error.message, error.message.includes('quyền') ? 403 : 500);
    }
});

// ==========================================
// POST /api/tasks
// Create new task with permission check
// ==========================================
export const POST = withAuth(async (req, user) => {
    try {
        const body = await req.json();
        const validatedData = createTaskSchema.parse(body);

        const task = await TaskServerService.createTask(user, validatedData);
        return successResponse(task, 201);
    } catch (error: any) {
        const isForbidden = ['quyền'].some(msg => error.message.toLowerCase().includes(msg));
        const status = isForbidden ? 403 : 400; // Trả về 400 cho các validation error
        return errorResponse(error.message, status);
    }
});
