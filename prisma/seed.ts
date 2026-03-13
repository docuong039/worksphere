
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PERMISSIONS } from '../src/lib/constants';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Bắt đầu dọn dẹp và khởi tạo dữ liệu chuẩn (Clean Mode)...');

    // 1. Dọn dẹp dữ liệu cũ
    await prisma.timeLog.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.watcher.deleteMany();
    await prisma.attachment.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.auditLog.deleteMany();

    await prisma.task.updateMany({ data: { parentId: null } });
    await prisma.task.deleteMany();

    await prisma.version.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.projectTracker.deleteMany();
    await prisma.workflowTransition.deleteMany();
    await prisma.roleTracker.deleteMany();
    await prisma.rolePermission.deleteMany();


    await prisma.project.deleteMany();

    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.tracker.deleteMany();
    await prisma.status.deleteMany();
    await prisma.priority.deleteMany();
    await prisma.timeEntryActivity.deleteMany();

    console.log('✅ Đã dọn dẹp database.');

    // 2. Khởi tạo Quyền (Permissions) - Với tên tiếng Việt
    console.log('📝 Khởi tạo danh sách quyền thực tế...');

    // Mapping tên tiếng Việt cho tất cả permissions
    const permissionNames: Record<string, string> = {
        // Tasks
        'tasks.view_all': 'Xem tất cả công việc',
        'tasks.view_project': 'Xem công việc trong dự án',
        'tasks.view_assigned': 'Xem công việc được gán',
        'tasks.create': 'Tạo công việc',
        'tasks.edit_any': 'Sửa bất kỳ công việc',
        'tasks.edit_assigned': 'Sửa công việc được gán',
        'tasks.edit_own': 'Sửa công việc của mình',
        'tasks.delete_any': 'Xóa bất kỳ công việc',
        'tasks.delete_own': 'Xóa công việc của mình',
        'tasks.manage_watchers': 'Quản lý người theo dõi',
        'tasks.assign_others': 'Giao việc cho người khác',
        // Comments
        'comments.add': 'Thêm bình luận',
        'comments.edit_own': 'Sửa bình luận của mình',
        'comments.edit_all': 'Sửa tất cả bình luận',
        'comments.delete_own': 'Xóa bình luận của mình',
        'comments.delete_all': 'Xóa tất cả bình luận',
        // Time Logs
        'timelogs.log_time': 'Ghi nhận thời gian',
        'timelogs.view_all': 'Xem tất cả thời gian',
        'timelogs.view_own': 'Xem thời gian của mình',
        'timelogs.edit_all': 'Sửa tất cả thời gian',
        'timelogs.edit_own': 'Sửa thời gian của mình',
        'timelogs.delete_all': 'Xóa tất cả thời gian',
        'timelogs.delete_own': 'Xóa thời gian của mình',
        // Projects
        'projects.create': 'Tạo dự án',
        'projects.edit': 'Sửa dự án',
        'projects.archive': 'Lưu trữ dự án',
        'projects.delete': 'Xóa dự án',
        'projects.manage_members': 'Quản lý thành viên',
        'projects.manage_versions': 'Quản lý phiên bản',
        'projects.manage_trackers': 'Quản lý loại công việc',
        // Queries
        'queries.manage_public': 'Quản lý bộ lọc công khai',
    };

    const allPermissions: { key: string; name: string; module: string }[] = [];

    Object.entries(PERMISSIONS).forEach(([moduleName, actions]) => {
        Object.entries(actions).forEach(([, key]) => {
            allPermissions.push({
                key: key as string,
                name: permissionNames[key as string] || key as string,
                module: moduleName
            });
        });
    });

    for (const perm of allPermissions) {
        await prisma.permission.create({ data: perm });
    }

    // 3. Khởi tạo Cấu hình hệ thống
    const trackers = await Promise.all([
        prisma.tracker.create({ data: { name: 'Tính năng (Feature)', position: 1, isDefault: true } }),
        prisma.tracker.create({ data: { name: 'Lỗi (Bug)', position: 2 } }),
        prisma.tracker.create({ data: { name: 'Hỗ trợ (Support)', position: 3 } }),
    ]);

    const statuses = await Promise.all([
        prisma.status.create({ data: { name: 'Mới', position: 1, isDefault: true } }),
        prisma.status.create({ data: { name: 'Đang làm', position: 2 } }),
        prisma.status.create({ data: { name: 'Đã xử lý', position: 3 } }),
        prisma.status.create({ data: { name: 'Phản hồi', position: 4 } }),
        prisma.status.create({ data: { name: 'Đóng', position: 5, isClosed: true } }),
    ]);

    const priorities = await Promise.all([
        prisma.priority.create({ data: { name: 'Thấp', position: 1, color: '#94a3b8' } }),
        prisma.priority.create({ data: { name: 'Bình thường', position: 2, color: '#3b82f6', isDefault: true } }),
        prisma.priority.create({ data: { name: 'Cao', position: 3, color: '#f59e0b' } }),
        prisma.priority.create({ data: { name: 'Khẩn cấp', position: 4, color: '#ef4444' } }),
    ]);

    const activities = await Promise.all([
        prisma.timeEntryActivity.create({ data: { name: 'Lập trình', position: 1, isDefault: true } }),
        prisma.timeEntryActivity.create({ data: { name: 'Thiết kế', position: 2 } }),
        prisma.timeEntryActivity.create({ data: { name: 'Kiểm thử', position: 3 } }),
    ]);

    // 4. Khởi tạo Vai trò (Roles)
    console.log('👥 Khởi tạo vai trò chuẩn...');

    const roleManager = await prisma.role.create({
        data: { name: 'Manager', description: 'Quản lý toàn bộ dự án' }
    });

    const roleDev = await prisma.role.create({
        data: { name: 'Developer', description: 'Thực hiện các công việc kỹ thuật' }
    });

    // Manager có tất cả quyền
    const allPerms = await prisma.permission.findMany();
    await prisma.rolePermission.createMany({
        data: allPerms.map(p => ({ roleId: roleManager.id, permissionId: p.id }))
    });

    // Dev có quyền hạn chế
    const devPermKeys = [
        // Tasks
        PERMISSIONS.TASKS.VIEW_PROJECT, PERMISSIONS.TASKS.VIEW_ASSIGNED, PERMISSIONS.TASKS.CREATE,
        PERMISSIONS.TASKS.EDIT_OWN, PERMISSIONS.TASKS.EDIT_ASSIGNED, PERMISSIONS.TASKS.DELETE_OWN,
        // Comments
        PERMISSIONS.COMMENTS.ADD, PERMISSIONS.COMMENTS.EDIT_OWN, PERMISSIONS.COMMENTS.DELETE_OWN,
        // Time Logs
        PERMISSIONS.TIMELOGS.LOG_TIME, PERMISSIONS.TIMELOGS.VIEW_OWN, PERMISSIONS.TIMELOGS.EDIT_OWN, PERMISSIONS.TIMELOGS.DELETE_OWN
    ];
    const devPerms = allPerms.filter(p => devPermKeys.includes(p.key as any));
    await prisma.rolePermission.createMany({
        data: devPerms.map(p => ({ roleId: roleDev.id, permissionId: p.id }))
    });

    // 5. Khởi tạo Người dùng
    const hp = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.create({ data: { email: 'admin@worksphere.com', name: 'Quản trị hệ thống', password: hp, isAdministrator: true } });
    const managerUser = await prisma.user.create({ data: { email: 'manager@worksphere.com', name: 'Nguyễn Quản Lý', password: hp } });
    const devUser = await prisma.user.create({ data: { email: 'dev@worksphere.com', name: 'Trần Lập Trình', password: hp } });

    // 6. Khởi tạo Dự án & Dữ liệu Demo
    const mainProject = await prisma.project.create({
        data: {
            name: 'Hệ thống Quản trị WorkSphere',
            identifier: 'worksphere-core',
            description: 'Dự án trọng điểm phát triển nền tảng quản trị công việc.',
            creatorId: adminUser.id,
            members: {
                create: [
                    { userId: managerUser.id, roleId: roleManager.id },
                    { userId: devUser.id, roleId: roleDev.id }
                ]
            }
        }
    });

    await prisma.projectTracker.createMany({
        data: trackers.map(t => ({ projectId: mainProject.id, trackerId: t.id }))
    });

    // 7. Task mẫu
    const task = await prisma.task.create({
        data: {
            title: 'Thiết kế hệ thống phân quyền (RBAC)',
            description: 'Phân tích và triển khai các bảng Role, Permission, User.',
            projectId: mainProject.id,
            trackerId: trackers[0].id,
            statusId: statuses[1].id, // Đang làm
            priorityId: priorities[2].id, // Cao
            creatorId: managerUser.id,
            assigneeId: devUser.id,
            estimatedHours: 16,
            startDate: new Date(),
        }
    });

    await prisma.timeLog.create({
        data: {
            hours: 4.5,
            spentOn: new Date(),
            userId: devUser.id,
            projectId: mainProject.id,
            taskId: task.id,
            activityId: activities[0].id,
            comments: 'Đã hoàn thành phần database schema cho Permissions.'
        }
    });

    console.log('✨ Hệ thống đã được làm sạch và cài đặt dữ liệu chuẩn.');
}

main()
    .catch((e) => {
        console.error('❌ Lỗi Seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
