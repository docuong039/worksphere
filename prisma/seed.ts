
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed with current DB state...');

    // ============================================
    // 1. CREATE PERMISSIONS
    // ============================================
    console.log('📝 Syncing permissions...');

    const permissions = [
        // User Management (Người dùng)
        { key: 'users.view_all', name: 'View All Users', module: 'Người dùng' },
        { key: 'users.create', name: 'Create User', module: 'Người dùng' },
        { key: 'users.edit_any', name: 'Edit Any User', module: 'Người dùng' },
        { key: 'users.delete', name: 'Delete User', module: 'Người dùng' },
        { key: 'users.set_administrator', name: 'Set Administrator', module: 'Người dùng' },

        // Project Management (Dự án)
        { key: 'projects.view_all', name: 'View All Projects', module: 'Dự án' },

        { key: 'projects.create', name: 'Create Project', module: 'Dự án' },
        { key: 'projects.edit_own', name: 'Edit Own Project', module: 'Dự án' },
        { key: 'projects.edit_any', name: 'Edit Any Project', module: 'Dự án' },
        { key: 'projects.delete_any', name: 'Delete Any Project', module: 'Dự án' },
        { key: 'projects.manage_members', name: 'Manage Members', module: 'Dự án' },
        { key: 'projects.manage_versions', name: 'Manage Versions', module: 'Dự án' },
        { key: 'projects.manage_trackers', name: 'Manage Trackers', module: 'Dự án' },
        { key: 'projects.create_subprojects', name: 'Create Sub-projects', module: 'Dự án' },
        { key: 'projects.manage', name: 'Manage Project Settings', module: 'Dự án' },
        { key: 'projects.archive', name: 'Archive Project', module: 'Dự án' },

        // Task Management (Công việc)
        { key: 'tasks.view_all', name: 'View All Tasks', module: 'Công việc' },
        { key: 'tasks.view_project', name: 'View Project Tasks', module: 'Công việc' },
        { key: 'tasks.view_assigned', name: 'View Assigned Tasks', module: 'Công việc' },
        { key: 'tasks.create', name: 'Create Task', module: 'Công việc' },
        { key: 'tasks.edit_own', name: 'Edit Own Task', module: 'Công việc' },
        { key: 'tasks.edit_assigned', name: 'Edit Assigned Task', module: 'Công việc' },
        { key: 'tasks.edit_any', name: 'Edit Any Task', module: 'Công việc' },
        { key: 'tasks.delete_any', name: 'Delete Any Task', module: 'Công việc' },
        { key: 'tasks.assign', name: 'Assign Task', module: 'Công việc' },
        { key: 'tasks.change_status', name: 'Change Status', module: 'Công việc' },
        { key: 'tasks.comment', name: 'Add Comment', module: 'Công việc' },
        { key: 'tasks.upload_files', name: 'Upload Files', module: 'Công việc' },
        { key: 'tasks.manage_comments', name: 'Manage Comments (Edit/Delete Any)', module: 'Công việc' },

        // Reports (Báo cáo)
        { key: 'reports.view_personal', name: 'View Personal Reports', module: 'Báo cáo' },
        { key: 'reports.view_project', name: 'View Project Reports', module: 'Báo cáo' },
        { key: 'reports.view_system', name: 'View System Reports', module: 'Báo cáo' },
        { key: 'reports.export', name: 'Export Reports', module: 'Báo cáo' },

        // Queries (Bộ lọc)
        { key: 'queries.manage_public', name: 'Manage Public Queries', module: 'Bộ lọc' },

        // Time Logs (Thời gian)
        { key: 'timelogs.log_time', name: 'Log Time', module: 'Thời gian' },
        { key: 'timelogs.view_own', name: 'View Own Time Logs', module: 'Thời gian' },
        { key: 'timelogs.view_all', name: 'View All Time Logs', module: 'Thời gian' },
        { key: 'timelogs.edit_own', name: 'Edit Own Time Logs', module: 'Thời gian' },

        { key: 'timelogs.delete_own', name: 'Delete Own Time Logs', module: 'Thời gian' },


        // System (Hệ thống)
        { key: 'system.manage_roles', name: 'Manage Roles', module: 'Hệ thống' },
        { key: 'system.manage_config', name: 'Manage Configuration', module: 'Hệ thống' },
        { key: 'system.settings', name: 'System Settings', module: 'Hệ thống' },
        { key: 'system.audit_logs', name: 'View Audit Logs', module: 'Hệ thống' },
    ];

    for (const perm of permissions) {
        await prisma.permission.upsert({
            where: { key: perm.key },
            update: {
                name: perm.name,
                module: perm.module,
            },
            create: perm,
        });
    }

    // ============================================
    // 2. SYNC TRACKERS
    // ============================================
    console.log('🏷️ Syncing trackers...');
    const trackers = [
        { name: 'Bug', description: 'Software bugs and errors', position: 1, isDefault: false },
        { name: 'Feature', description: 'New features and enhancements', position: 2, isDefault: true },
        { name: 'Task', description: 'General tasks', position: 3, isDefault: false },
        { name: 'Support', description: 'Customer support requests', position: 4, isDefault: false },
    ];

    for (const tracker of trackers) {
        await prisma.tracker.upsert({
            where: { name: tracker.name },
            update: {
                description: tracker.description,
                position: tracker.position,
                isDefault: tracker.isDefault,
            },
            create: tracker,
        });
    }

    // ============================================
    // 3. SYNC STATUSES
    // ============================================
    console.log('📊 Syncing statuses...');
    const statuses = [
        { name: 'New', position: 1, isClosed: false, isDefault: true },
        { name: 'In Progress', position: 2, isClosed: false, isDefault: false },
        { name: 'Resolved', position: 3, isClosed: false, isDefault: false },
        { name: 'Closed', position: 4, isClosed: true, isDefault: false },
    ];

    for (const status of statuses) {
        await prisma.status.upsert({
            where: { name: status.name },
            update: {
                position: status.position,
                isClosed: status.isClosed,
                isDefault: status.isDefault,
            },
            create: status,
        });
    }

    // ============================================
    // 4. SYNC PRIORITIES
    // ============================================
    console.log('🔝 Syncing priorities...');
    const priorities = [
        { name: 'Low', position: 1, color: '#10b981', isDefault: true },
        { name: 'Normal', position: 2, color: '#3b82f6', isDefault: false },
        { name: 'High', position: 3, color: '#f59e0b', isDefault: false },
        { name: 'Urgent', position: 4, color: '#ef4444', isDefault: false },
        { name: 'Immediate', position: 5, color: '#8b5cf6', isDefault: false },
    ];

    for (const priority of priorities) {
        await prisma.priority.upsert({
            where: { name: priority.name },
            update: {
                position: priority.position,
                color: priority.color,
                isDefault: priority.isDefault,
            },
            create: priority,
        });
    }

    // ============================================
    // 5. SYNC DEFAULT ADMIN
    // ============================================
    const adminEmail = 'admin@worksphere.com';
    const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!adminUser) {
        console.log('👤 Creating default admin user...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await prisma.user.create({
            data: {
                email: adminEmail,
                name: 'Administrator',
                password: hashedPassword,
                isAdministrator: true,
            },
        });
    }

    // ============================================
    // TIME ENTRY ACTIVITIES
    // ============================================
    console.log('Seeding time entry activities...');
    const activitiesData = [
        { name: 'Phát triển', position: 1, isDefault: true },
        { name: 'Thiết kế', position: 2, isDefault: false },
        { name: 'Kiểm thử', position: 3, isDefault: false },
        { name: 'Họp', position: 4, isDefault: false },
        { name: 'Nghiên cứu', position: 5, isDefault: false },
        { name: 'Hỗ trợ', position: 6, isDefault: false },
    ];

    for (const activity of activitiesData) {
        await prisma.timeEntryActivity.upsert({
            where: { name: activity.name },
            update: {},
            create: activity,
        });
    }


    // ============================================
    // 7. SYNC ROLES & PERMISSIONS
    // ============================================
    console.log('👥 Syncing roles...');

    // Define Roles and their Permission Keys
    const roleDefinitions = [
        {
            name: 'Manager',
            description: 'Project Manager with full access',
            permissions: permissions.map(p => p.key) // Manager gets all permissions
        },
        {
            name: 'Developer',
            description: 'Team member who works on tasks',
            permissions: [
                'projects.view_all',
                'tasks.view_all', 'tasks.view_project', 'tasks.view_assigned',
                'tasks.create', 'tasks.edit_own', 'tasks.edit_assigned',
                'tasks.assign', 'tasks.change_status', 'tasks.comment', 'tasks.upload_files',
                'timelogs.log_time', 'timelogs.view_own', 'timelogs.edit_own',
                'reports.view_project'
            ]
        },
        {
            name: 'Reporter',
            description: 'Tester or stakeholder who reports issues',
            permissions: [
                'projects.view_all',
                'tasks.view_all', 'tasks.view_project',
                'tasks.create', 'tasks.edit_own',
                'tasks.comment', 'tasks.upload_files',
                'reports.view_project'
            ]
        },
        {
            name: 'Viewer',
            description: 'Read-only access',
            permissions: [
                'projects.view_all',
                'tasks.view_all', 'tasks.view_project',
                'reports.view_project'
            ]
        }
    ];

    for (const roleDef of roleDefinitions) {
        // 1. Create/Update Role
        // Note: 'isSystem' field does not exist in schema, so we omit it.
        const role = await prisma.role.upsert({
            where: { name: roleDef.name },
            update: {
                description: roleDef.description,
            },
            create: {
                name: roleDef.name,
                description: roleDef.description,
            }
        });

        console.log(`   - Role: ${role.name}`);

        // 2. Sync Permissions for this Role
        // First get all Permission IDs for the keys
        const permissionRecs = await prisma.permission.findMany({
            where: { key: { in: roleDef.permissions } },
            select: { id: true }
        });

        // We need to manage RolePermission (table name in schema: role_permissions, model: RolePermission)

        // Find existing relations
        const existingRelations = await prisma.rolePermission.findMany({
            where: { roleId: role.id },
            select: { permissionId: true }
        });

        const existingPermIds = new Set(existingRelations.map(r => r.permissionId));
        const newPermIds = new Set(permissionRecs.map(p => p.id));

        // Add missing
        for (const pId of newPermIds) {
            if (!existingPermIds.has(pId)) {
                await prisma.rolePermission.create({
                    data: { roleId: role.id, permissionId: pId }
                });
            }
        }
    }

    // ============================================
    // 8. SYNC DEFAULT WORKFLOW
    // ============================================
    console.log('twisted_rightwards_arrows Syncing default workflow...');

    // Get IDs needed for Matrix
    const trackerBug = await prisma.tracker.findUnique({ where: { name: 'Bug' } });
    const trackerTask = await prisma.tracker.findUnique({ where: { name: 'Task' } });
    const trackerFeature = await prisma.tracker.findUnique({ where: { name: 'Feature' } });

    const statusNew = await prisma.status.findUnique({ where: { name: 'New' } });
    const statusInProgress = await prisma.status.findUnique({ where: { name: 'In Progress' } });
    const statusResolved = await prisma.status.findUnique({ where: { name: 'Resolved' } });
    const statusClosed = await prisma.status.findUnique({ where: { name: 'Closed' } });

    const roleManager = await prisma.role.findUnique({ where: { name: 'Manager' } });
    const roleDev = await prisma.role.findUnique({ where: { name: 'Developer' } });

    if (trackerTask && statusNew && statusInProgress && statusResolved && statusClosed) {

        // Helper to add transition
        const addTransition = async (trackerId: string, fromId: string, toId: string, roleId: string | null = null) => {
            const exists = await prisma.workflowTransition.findFirst({
                where: { trackerId, fromStatusId: fromId, toStatusId: toId, roleId }
            });
            if (!exists) {
                await prisma.workflowTransition.create({
                    data: { trackerId, fromStatusId: fromId, toStatusId: toId, roleId }
                });
            }
        };

        const trackers = [trackerTask, trackerBug, trackerFeature].filter(Boolean);
        const statuses = [statusNew, statusInProgress, statusResolved, statusClosed];

        for (const tr of trackers) {
            if (!tr) continue;

            // 1. Manager Link: Can go from ANY status to ANY status
            if (roleManager) {
                for (const s1 of statuses) {
                    for (const s2 of statuses) {
                        if (s1.id !== s2.id) {
                            await addTransition(tr.id, s1.id, s2.id, roleManager.id);
                        }
                    }
                }
            }

            // 2. Developer Link: Standard Flow
            if (roleDev) {
                await addTransition(tr.id, statusNew.id, statusInProgress.id, roleDev.id);
                await addTransition(tr.id, statusInProgress.id, statusResolved.id, roleDev.id);
                await addTransition(tr.id, statusResolved.id, statusInProgress.id, roleDev.id);
                await addTransition(tr.id, statusResolved.id, statusClosed.id, roleDev.id);
            }
        }
    }

    console.log('✅ Seed completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
