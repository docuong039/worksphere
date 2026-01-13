const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // ============================================
    // 1. CREATE PERMISSIONS (40+)
    // ============================================
    console.log('📝 Creating permissions...');
    const permissions = [
        // User Management (5)
        { key: 'users.view_all', name: 'View All Users', module: 'users' },
        { key: 'users.create', name: 'Create User', module: 'users' },
        { key: 'users.edit_any', name: 'Edit Any User', module: 'users' },
        { key: 'users.delete', name: 'Delete User', module: 'users' },
        { key: 'users.set_administrator', name: 'Set Administrator', module: 'users' },

        // Project Management (8)
        { key: 'projects.view_all', name: 'View All Projects', module: 'projects' },
        { key: 'projects.view_joined', name: 'View Joined Projects', module: 'projects' },
        { key: 'projects.create', name: 'Create Project', module: 'projects' },
        { key: 'projects.edit_own', name: 'Edit Own Project', module: 'projects' },
        { key: 'projects.edit_any', name: 'Edit Any Project', module: 'projects' },
        { key: 'projects.delete_any', name: 'Delete Any Project', module: 'projects' },
        { key: 'projects.manage_members', name: 'Manage Members', module: 'projects' },
        { key: 'projects.archive', name: 'Archive Project', module: 'projects' },

        // Task Management (16)
        { key: 'tasks.view_all', name: 'View All Tasks', module: 'tasks' },
        { key: 'tasks.view_project', name: 'View Project Tasks', module: 'tasks' },
        { key: 'tasks.view_assigned', name: 'View Assigned Tasks', module: 'tasks' },
        { key: 'tasks.create', name: 'Create Task', module: 'tasks' },
        { key: 'tasks.edit_own', name: 'Edit Own Task', module: 'tasks' },
        { key: 'tasks.edit_assigned', name: 'Edit Assigned Task', module: 'tasks' },
        { key: 'tasks.edit_any', name: 'Edit Any Task', module: 'tasks' },
        { key: 'tasks.delete_own', name: 'Delete Own Task', module: 'tasks' },
        { key: 'tasks.delete_any', name: 'Delete Any Task', module: 'tasks' },
        { key: 'tasks.assign', name: 'Assign Task', module: 'tasks' },
        { key: 'tasks.change_status', name: 'Change Status', module: 'tasks' },
        { key: 'tasks.comment', name: 'Add Comment', module: 'tasks' },
        { key: 'tasks.upload_files', name: 'Upload Files', module: 'tasks' },
        { key: 'tasks.manage_watchers', name: 'Manage Watchers', module: 'tasks' },
        { key: 'tasks.duplicate', name: 'Duplicate Task', module: 'tasks' },
        { key: 'tasks.create_subtask', name: 'Create Subtask', module: 'tasks' },

        // Time Tracking (7)
        { key: 'time.log', name: 'Log Time', module: 'time' },
        { key: 'time.view_own', name: 'View Own Time', module: 'time' },
        { key: 'time.view_team', name: 'View Team Time', module: 'time' },
        { key: 'time.view_all', name: 'View All Time', module: 'time' },
        { key: 'time.edit_own', name: 'Edit Own Time', module: 'time' },
        { key: 'time.edit_any', name: 'Edit Any Time', module: 'time' },
        { key: 'time.delete_any', name: 'Delete Any Time', module: 'time' },

        // Reports (4)
        { key: 'reports.view_personal', name: 'View Personal Reports', module: 'reports' },
        { key: 'reports.view_project', name: 'View Project Reports', module: 'reports' },
        { key: 'reports.view_system', name: 'View System Reports', module: 'reports' },
        { key: 'reports.export', name: 'Export Reports', module: 'reports' },

        // System (4)
        { key: 'system.manage_roles', name: 'Manage Roles', module: 'system' },
        { key: 'system.manage_config', name: 'Manage Configuration', module: 'system' },
        { key: 'system.settings', name: 'System Settings', module: 'system' },
        { key: 'system.audit_logs', name: 'View Audit Logs', module: 'system' },
    ];

    for (const perm of permissions) {
        await prisma.permission.upsert({
            where: { key: perm.key },
            update: {},
            create: perm,
        });
    }
    console.log(`✅ Created ${permissions.length} permissions`);

    // ============================================
    // 2. CREATE TRACKERS
    // ============================================
    console.log('🏷️  Creating trackers...');
    const trackers = [
        { name: 'Bug', description: 'Lỗi phần mềm', position: 1, isDefault: false },
        { name: 'Feature', description: 'Tính năng mới', position: 2, isDefault: false },
        { name: 'Task', description: 'Công việc thường', position: 3, isDefault: true },
        { name: 'Support', description: 'Hỗ trợ khách hàng', position: 4, isDefault: false },
    ];

    for (const tracker of trackers) {
        await prisma.tracker.upsert({
            where: { name: tracker.name },
            update: {},
            create: tracker,
        });
    }
    console.log(`✅ Created ${trackers.length} trackers`);

    // ============================================
    // 3. CREATE STATUSES
    // ============================================
    console.log('📊 Creating statuses...');
    const statuses = [
        { name: 'New', description: 'Mới tạo', position: 1, isClosed: false, isDefault: true },
        { name: 'In Progress', description: 'Đang thực hiện', position: 2, isClosed: false, isDefault: false },
        { name: 'Resolved', description: 'Đã giải quyết', position: 3, isClosed: false, isDefault: false },
        { name: 'Closed', description: 'Đã đóng', position: 4, isClosed: true, isDefault: false },
        { name: 'Rejected', description: 'Từ chối', position: 5, isClosed: true, isDefault: false },
    ];

    for (const status of statuses) {
        await prisma.status.upsert({
            where: { name: status.name },
            update: {},
            create: status,
        });
    }
    console.log(`✅ Created ${statuses.length} statuses`);

    // ============================================
    // 4. CREATE PRIORITIES
    // ============================================
    console.log('🎯 Creating priorities...');
    const priorities = [
        { name: 'Low', position: 1, color: '#10b981', isDefault: false },
        { name: 'Normal', position: 2, color: '#3b82f6', isDefault: true },
        { name: 'High', position: 3, color: '#f59e0b', isDefault: false },
        { name: 'Urgent', position: 4, color: '#ef4444', isDefault: false },
        { name: 'Immediate', position: 5, color: '#8b5cf6', isDefault: false },
    ];

    for (const priority of priorities) {
        await prisma.priority.upsert({
            where: { name: priority.name },
            update: {},
            create: priority,
        });
    }
    console.log(`✅ Created ${priorities.length} priorities`);

    // ============================================
    // 5. CREATE DEFAULT ROLES (Manager, Developer, Tester, Viewer)
    // ============================================
    console.log('👥 Creating default roles...');

    const allPermissions = await prisma.permission.findMany();

    // Manager - nhiều quyền
    const managerRole = await prisma.role.upsert({
        where: { name: 'Manager' },
        update: {},
        create: { name: 'Manager', description: 'Quản lý dự án với đầy đủ quyền' },
    });

    const managerPerms = allPermissions.filter(
        p => !p.key.startsWith('system.') && !p.key.includes('_all')
    );
    for (const perm of managerPerms) {
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: managerRole.id, permissionId: perm.id } },
            update: {},
            create: { roleId: managerRole.id, permissionId: perm.id },
        });
    }

    // Developer
    const developerRole = await prisma.role.upsert({
        where: { name: 'Developer' },
        update: {},
        create: { name: 'Developer', description: 'Lập trình viên' },
    });

    const developerPermKeys = [
        'projects.view_joined', 'tasks.view_project', 'tasks.create', 'tasks.edit_assigned',
        'tasks.comment', 'tasks.upload_files', 'tasks.change_status', 'time.log', 'time.view_own',
        'reports.view_personal'
    ];
    for (const key of developerPermKeys) {
        const perm = allPermissions.find(p => p.key === key);
        if (perm) {
            await prisma.rolePermission.upsert({
                where: { roleId_permissionId: { roleId: developerRole.id, permissionId: perm.id } },
                update: {},
                create: { roleId: developerRole.id, permissionId: perm.id },
            });
        }
    }

    // Tester
    const testerRole = await prisma.role.upsert({
        where: { name: 'Tester' },
        update: {},
        create: { name: 'Tester', description: 'Kiểm thử viên' },
    });

    const testerPermKeys = [
        'projects.view_joined', 'tasks.view_project', 'tasks.create', 'tasks.comment',
        'tasks.change_status', 'time.log', 'time.view_own', 'reports.view_personal'
    ];
    for (const key of testerPermKeys) {
        const perm = allPermissions.find(p => p.key === key);
        if (perm) {
            await prisma.rolePermission.upsert({
                where: { roleId_permissionId: { roleId: testerRole.id, permissionId: perm.id } },
                update: {},
                create: { roleId: testerRole.id, permissionId: perm.id },
            });
        }
    }

    // Viewer
    const viewerRole = await prisma.role.upsert({
        where: { name: 'Viewer' },
        update: {},
        create: { name: 'Viewer', description: 'Chỉ xem (read-only)' },
    });

    const viewerPermKeys = ['projects.view_joined', 'tasks.view_project', 'reports.view_personal'];
    for (const key of viewerPermKeys) {
        const perm = allPermissions.find(p => p.key === key);
        if (perm) {
            await prisma.rolePermission.upsert({
                where: { roleId_permissionId: { roleId: viewerRole.id, permissionId: perm.id } },
                update: {},
                create: { roleId: viewerRole.id, permissionId: perm.id },
            });
        }
    }

    console.log('✅ Created 4 default roles with permissions');

    // ============================================
    // 6. CREATE DEFAULT WORKFLOW
    // ============================================
    console.log('🔄 Creating default workflow...');

    const allTrackers = await prisma.tracker.findMany();
    const allStatuses = await prisma.status.findMany();

    const newStatus = allStatuses.find(s => s.name === 'New');
    const inProgressStatus = allStatuses.find(s => s.name === 'In Progress');
    const resolvedStatus = allStatuses.find(s => s.name === 'Resolved');
    const closedStatus = allStatuses.find(s => s.name === 'Closed');
    const rejectedStatus = allStatuses.find(s => s.name === 'Rejected');

    if (newStatus && inProgressStatus && resolvedStatus && closedStatus && rejectedStatus) {
        const defaultTransitions = [
            { from: newStatus.id, to: inProgressStatus.id },
            { from: newStatus.id, to: rejectedStatus.id },
            { from: inProgressStatus.id, to: resolvedStatus.id },
            { from: inProgressStatus.id, to: rejectedStatus.id },
            { from: resolvedStatus.id, to: closedStatus.id },
            { from: resolvedStatus.id, to: inProgressStatus.id },
            { from: closedStatus.id, to: inProgressStatus.id },
        ];

        for (const tracker of allTrackers) {
            for (const trans of defaultTransitions) {
                try {
                    await prisma.workflowTransition.upsert({
                        where: {
                            trackerId_roleId_fromStatusId_toStatusId: {
                                trackerId: tracker.id,
                                roleId: null,
                                fromStatusId: trans.from,
                                toStatusId: trans.to,
                            },
                        },
                        update: {},
                        create: {
                            trackerId: tracker.id,
                            roleId: null,
                            fromStatusId: trans.from,
                            toStatusId: trans.to,
                        },
                    });
                } catch (e) {
                    // Skip if already exists
                }
            }
        }
        console.log('✅ Created default workflow transitions');
    }

    // ============================================
    // 7. CREATE ADMIN USER
    // ============================================
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('igf', 10);
    await prisma.user.upsert({
        where: { email: 'admin@worksphere.com' },
        update: { password: hashedPassword },
        create: {
            email: 'admin@worksphere.com',
            name: 'Administrator',
            password: hashedPassword,
            isAdministrator: true,
        },
    });
    console.log('✅ Created admin user');

    console.log('\n🎉 Seed completed!');
    console.log('\n📊 Summary:');
    console.log(`   - ${permissions.length} permissions`);
    console.log(`   - ${trackers.length} trackers`);
    console.log(`   - ${statuses.length} statuses`);
    console.log(`   - ${priorities.length} priorities`);
    console.log('   - 4 roles (Manager, Developer, Tester, Viewer)');
    console.log('   - Default workflow transitions');
    console.log('   - 1 admin user');
    console.log('\n🔐 Admin: admin@worksphere.com / igf');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
