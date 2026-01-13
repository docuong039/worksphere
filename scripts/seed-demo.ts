
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const admin = await prisma.user.findFirst({
        where: { isAdministrator: true }
    });

    if (!admin) {
        console.error('No admin user found');
        return;
    }

    // 1. Create Demo Project
    const project = await prisma.project.create({
        data: {
            name: 'Dự án Xây dựng Website Bán hàng',
            identifier: 'website-bh-' + Math.floor(Math.random() * 1000),
            description: 'Dự án demo để minh họa Version và Roadmap',
            creatorId: admin.id,
            members: {
                create: {
                    userId: admin.id,
                    roleId: (await prisma.role.findFirst())?.id || '',
                }
            }
        }
    });

    // 2. Create Trackers if not exist
    const tracker = await prisma.tracker.findFirst();
    const statusNew = await prisma.status.findFirst({ where: { name: 'New' } });
    const statusInProg = await prisma.status.findFirst({ where: { name: 'In Progress' } });
    const statusDone = await prisma.status.findFirst({ where: { isClosed: true } });
    const priorityNormal = await prisma.priority.findFirst();

    // 3. Create Versions
    const v1 = await prisma.version.create({
        data: {
            name: 'v1.0 - MVP (Ra mắt tối thiểu)',
            description: 'Hoàn thành các tính năng cơ bản nhất để chạy được web.',
            projectId: project.id,
            dueDate: new Date('2026-02-15'),
            status: 'open'
        }
    });

    const v2 = await prisma.version.create({
        data: {
            name: 'v1.1 - Nâng cao trải nghiệm',
            description: 'Thêm thanh toán và bình luận.',
            projectId: project.id,
            dueDate: new Date('2026-03-20'),
            status: 'open'
        }
    });

    // 4. Create Tasks for v1.0
    await prisma.task.createMany({
        data: [
            {
                title: 'Thiết kế giao diện trang chủ',
                projectId: project.id,
                versionId: v1.id,
                trackerId: tracker?.id || '',
                statusId: statusDone?.id || '',
                priorityId: priorityNormal?.id || '',
                creatorId: admin.id,
                doneRatio: 100
            },
            {
                title: 'Lập trình API lấy danh sách sản phẩm',
                projectId: project.id,
                versionId: v1.id,
                trackerId: tracker?.id || '',
                statusId: statusInProg?.id || '',
                priorityId: priorityNormal?.id || '',
                creatorId: admin.id,
                doneRatio: 60
            },
            {
                title: 'Cấu hình Database server',
                projectId: project.id,
                versionId: v1.id,
                trackerId: tracker?.id || '',
                statusId: statusNew?.id || '',
                priorityId: priorityNormal?.id || '',
                creatorId: admin.id,
                doneRatio: 0
            }
        ]
    });

    // 5. Create Tasks for v1.1
    await prisma.task.createMany({
        data: [
            {
                title: 'Tích hợp cổng thanh toán VNPay',
                projectId: project.id,
                versionId: v2.id,
                trackerId: tracker?.id || '',
                statusId: statusNew?.id || '',
                priorityId: priorityNormal?.id || '',
                creatorId: admin.id,
                doneRatio: 0
            },
            {
                title: 'Xây dựng hệ thống bình luận',
                projectId: project.id,
                versionId: v2.id,
                trackerId: tracker?.id || '',
                statusId: statusNew?.id || '',
                priorityId: priorityNormal?.id || '',
                creatorId: admin.id,
                doneRatio: 0
            }
        ]
    });

    console.log('Demo project created with ID:', project.id);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
