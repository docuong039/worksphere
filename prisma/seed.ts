import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL || 'mysql://root@localhost:3306/worksphere',
});

async function main() {
    console.log('🌱 Starting seed...');

    // ============================================
    // 1. CREATE PERMISSIONS
    // ============================================
    console.log('📝 Creating permissions...');

    const permissions = [
        // User Management
        { key: 'users.view_all', name: 'View All Users', module: 'users' },
        { key: 'users.create', name: 'Create User', module: 'users' },
        { key: 'users.edit_any', name: 'Edit Any User', module: 'users' },
        { key: 'users.delete', name: 'Delete User', module: 'users' },
        { key: 'users.set_administrator', name: 'Set Administrator', module: 'users' },

        // Project Management
        { key: 'projects.view_all', name: 'View All Projects', module: 'projects' },
        { key: 'projects.view_joined', name: 'View Joined Projects', module: 'projects' },
        { key: 'projects.create', name: 'Create Project', module: 'projects' },
        { key: 'projects.edit_own', name: 'Edit Own Project', module: 'projects' },
        { key: 'projects.edit_any', name: 'Edit Any Project', module: 'projects' },
        { key: 'projects.delete_any', name: 'Delete Any Project', module: 'projects' },
        { key: 'projects.manage_members', name: 'Manage Members', module: 'projects' },
        { key: 'projects.archive', name: 'Archive Project', module: 'projects' },

        // Task Management
        { key: 'tasks.view_all', name: 'View All Tasks', module: 'tasks' },
        { key: 'tasks.view_project', name: 'View Project Tasks', module: 'tasks' },
        { key: 'tasks.view_assigned', name: 'View Assigned Tasks', module: 'tasks' },
        { key: 'tasks.create', name: 'Create Task', module: 'tasks' },
        { key: 'tasks.edit_own', name: 'Edit Own Task', module: 'tasks' },
        { key: 'tasks.edit_assigned', name: 'Edit Assigned Task', module: 'tasks' },
        { key: 'tasks.edit_any', name: 'Edit Any Task', module: 'tasks' },
        { key: 'tasks.delete_any', name: 'Delete Any Task', module: 'tasks' },
        { key: 'tasks.assign', name: 'Assign Task', module: 'tasks' },
        { key: 'tasks.change_status', name: 'Change Status', module: 'tasks' },
        { key: 'tasks.comment', name: 'Add Comment', module: 'tasks' },
        { key: 'tasks.upload_files', name: 'Upload Files', module: 'tasks' },

        // Reports
        { key: 'reports.view_personal', name: 'View Personal Reports', module: 'reports' },
        { key: 'reports.view_project', name: 'View Project Reports', module: 'reports' },
        { key: 'reports.view_system', name: 'View System Reports', module: 'reports' },
        { key: 'reports.export', name: 'Export Reports', module: 'reports' },


        // System
        { key: 'system.manage_roles', name: 'Manage Roles', module: 'system' },
        { key: 'system.manage_config', name: 'Manage Configuration', module: 'system' },
        { key: 'system.settings', name: 'System Settings', module: 'system' },
        { key: 'system.audit_logs', name: 'View Audit Logs', module: 'system' },
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

    console.log(`✅ Created ${permissions.length} permissions`);

    // ============================================
    // 2. CREATE TRACKERS
    // ============================================
    console.log('🏷️  Creating trackers...');

    const trackers = [
        { name: 'Bug', description: 'Software bugs and errors', position: 1, isDefault: false },
        { name: 'Feature', description: 'New features and enhancements', position: 2, isDefault: false },
        { name: 'Task', description: 'General tasks', position: 3, isDefault: true },
        { name: 'Support', description: 'Customer support requests', position: 4, isDefault: false },
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
        { name: 'New', position: 1, isClosed: false, isDefault: true },
        { name: 'In Progress', position: 2, isClosed: false, isDefault: false },
        { name: 'Resolved', position: 3, isClosed: false, isDefault: false },
        { name: 'Closed', position: 4, isClosed: true, isDefault: false },
        { name: 'Rejected', position: 5, isClosed: true, isDefault: false },
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
    // 5. CREATE ROLES WITH PERMISSIONS
    // ============================================
    console.log('🎭 Creating roles with permissions...');

    // Helper function to assign permissions to role
    const assignPermissions = async (roleId: string, permissionKeys: string[]) => {
        for (const key of permissionKeys) {
            const permission = await prisma.permission.findUnique({ where: { key } });
            if (permission) {
                await prisma.rolePermission.upsert({
                    where: { roleId_permissionId: { roleId, permissionId: permission.id } },
                    update: {},
                    create: { roleId, permissionId: permission.id },
                });
            }
        }
    };

    // 1. MANAGER (Project Manager / Team Lead) - Almost full access
    const managerRole = await prisma.role.upsert({
        where: { name: 'Manager' },
        update: { description: 'Project Manager - Full project control', canAssignToOther: true },
        create: {
            name: 'Manager',
            description: 'Project Manager - Full project control',
            isActive: true,
            assignable: true,
            canAssignToOther: true,
        },
    });
    await assignPermissions(managerRole.id, [
        'projects.view_all', 'projects.view_joined', 'projects.create', 'projects.edit_own', 'projects.edit_any',
        'projects.manage_members', 'projects.archive',
        'tasks.view_all', 'tasks.view_project', 'tasks.view_assigned', 'tasks.create',
        'tasks.edit_own', 'tasks.edit_assigned', 'tasks.edit_any', 'tasks.delete_any',
        'tasks.assign', 'tasks.change_status', 'tasks.comment', 'tasks.upload_files',
        'reports.view_personal', 'reports.view_project', 'reports.view_system', 'reports.export',
    ]);

    // 2. TECH LEAD (Senior Developer with management rights)
    const techLeadRole = await prisma.role.upsert({
        where: { name: 'Tech Lead' },
        update: { description: 'Technical Lead - Can assign tasks and manage team', canAssignToOther: true },
        create: {
            name: 'Tech Lead',
            description: 'Technical Lead - Can assign tasks and manage team',
            isActive: true,
            assignable: true,
            canAssignToOther: true,
        },
    });
    await assignPermissions(techLeadRole.id, [
        'projects.view_joined', 'projects.edit_own',
        'tasks.view_all', 'tasks.view_project', 'tasks.view_assigned', 'tasks.create',
        'tasks.edit_own', 'tasks.edit_assigned', 'tasks.edit_any',
        'tasks.assign', 'tasks.change_status', 'tasks.comment', 'tasks.upload_files',
        'reports.view_personal', 'reports.view_project',
    ]);

    // 3. DEVELOPER (Standard developer)
    const developerRole = await prisma.role.upsert({
        where: { name: 'Developer' },
        update: { description: 'Developer - Work on assigned tasks', canAssignToOther: false },
        create: {
            name: 'Developer',
            description: 'Developer - Work on assigned tasks',
            isActive: true,
            assignable: true,
            canAssignToOther: false,
        },
    });
    await assignPermissions(developerRole.id, [
        'projects.view_joined',
        'tasks.view_project', 'tasks.view_assigned', 'tasks.create',
        'tasks.edit_own', 'tasks.edit_assigned',
        'tasks.change_status', 'tasks.comment', 'tasks.upload_files',
        'reports.view_personal',
    ]);

    // 4. TESTER / QA (Quality Assurance)
    const testerRole = await prisma.role.upsert({
        where: { name: 'Tester' },
        update: { description: 'QA Tester - Create bugs, verify fixes', canAssignToOther: false },
        create: {
            name: 'Tester',
            description: 'QA Tester - Create bugs, verify fixes',
            isActive: true,
            assignable: true,
            canAssignToOther: false,
        },
    });
    await assignPermissions(testerRole.id, [
        'projects.view_joined',
        'tasks.view_project', 'tasks.view_assigned', 'tasks.create',
        'tasks.edit_own', 'tasks.edit_assigned',
        'tasks.change_status', 'tasks.comment', 'tasks.upload_files',
        'reports.view_personal', 'reports.view_project',
    ]);

    // 5. DESIGNER (UI/UX Designer)
    const designerRole = await prisma.role.upsert({
        where: { name: 'Designer' },
        update: { description: 'UI/UX Designer - Create design tasks', canAssignToOther: false },
        create: {
            name: 'Designer',
            description: 'UI/UX Designer - Create design tasks',
            isActive: true,
            assignable: true,
            canAssignToOther: false,
        },
    });
    await assignPermissions(designerRole.id, [
        'projects.view_joined',
        'tasks.view_project', 'tasks.view_assigned', 'tasks.create',
        'tasks.edit_own', 'tasks.edit_assigned',
        'tasks.change_status', 'tasks.comment', 'tasks.upload_files',
        'reports.view_personal',
    ]);

    // 6. REPORTER (Client / Stakeholder - Read mostly)
    const reporterRole = await prisma.role.upsert({
        where: { name: 'Reporter' },
        update: { description: 'Reporter - Report issues, view progress', canAssignToOther: false },
        create: {
            name: 'Reporter',
            description: 'Reporter - Report issues, view progress',
            isActive: true,
            assignable: false,
            canAssignToOther: false,
        },
    });
    await assignPermissions(reporterRole.id, [
        'projects.view_joined',
        'tasks.view_project', 'tasks.create', 'tasks.edit_own',
        'tasks.comment',
        'reports.view_personal',
    ]);

    // 7. VIEWER (Read-only access)
    const viewerRole = await prisma.role.upsert({
        where: { name: 'Viewer' },
        update: { description: 'Viewer - Read-only access', canAssignToOther: false },
        create: {
            name: 'Viewer',
            description: 'Viewer - Read-only access',
            isActive: true,
            assignable: false,
            canAssignToOther: false,
        },
    });
    await assignPermissions(viewerRole.id, [
        'projects.view_joined',
        'tasks.view_project',
    ]);

    console.log('✅ Created 7 roles: Manager, Tech Lead, Developer, Tester, Designer, Reporter, Viewer');

    // ============================================
    // 6. CREATE ADMIN USER
    // ============================================
    console.log('👤 Creating admin user...');

    const hashedPassword = await bcrypt.hash('admin123', 10);

    await prisma.user.upsert({
        where: { email: 'admin@worksphere.com' },
        update: {},
        create: {
            email: 'admin@worksphere.com',
            name: 'Administrator',
            password: hashedPassword,
            isAdministrator: true,
        },
    });

    console.log('✅ Created admin user (admin@worksphere.com / admin123)');

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - ${permissions.length} permissions`);
    console.log(`   - ${trackers.length} trackers`);
    console.log(`   - ${statuses.length} statuses`);
    console.log(`   - ${priorities.length} priorities`);
    console.log(`   - 1 admin user`);
    console.log('\n🔐 Admin credentials:');
    console.log('   Email: admin@worksphere.com');
    console.log('   Password: admin123');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
