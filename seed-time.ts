import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- KHỞI ĐỘNG CHUỖI TỰ ĐỘNG LÀM ĐẸP DỮ LIỆU BÁO CÁO ---');

    const closedStatuses = await prisma.status.findMany({ where: { isClosed: true } });
    if (closedStatuses.length > 0) {
        const closedStatus = closedStatuses[0];
        
        // Cân đối tỉ lệ hoàn thành nhiệm vụ
        const allTasks = await prisma.task.findMany({ select: { id: true, status: { select: { isClosed: true } } } });
        const openTasks = allTasks.filter(t => !t.status.isClosed);
        const closedCount = allTasks.length - openTasks.length;
        
        // Mục tiêu: Hơn 50% task trong hệ thống phải được Đóng (Closed)
        const targetClosed = Math.floor(allTasks.length * 0.55);
        
        if (closedCount < targetClosed) {
            const needToClose = targetClosed - closedCount;
            // Chọn ngẫu nhiên needToClose task đang mở
            const shuffledOpen = openTasks.sort(() => 0.5 - Math.random());
            const pickedToClose = shuffledOpen.slice(0, needToClose);
            
            console.log(`Tiến độ hiện tại thấp. Đang tự động Đóng ${needToClose} công việc open...`);
            let closedUpdates = 0;
            for (const t of pickedToClose) {
                await prisma.task.update({
                    where: { id: t.id },
                    data: {
                        statusId: closedStatus.id,
                        doneRatio: 100 // Closed thì 100%
                    }
                });
                closedUpdates++;
            }
            console.log(`Đã hoàn thành thủ tục Đóng cho ${closedUpdates} công việc.`);
        } else {
            console.log(`Tỉ lệ hoàn thành đã đạt chuẩn (>50%). Không cần đóng thêm task.`);
        }
    } else {
        console.log('Hệ thống của bạn chưa có trạng thái dạng "Closed" nào được setup.');
    }

    console.log('\n--- BƯỚC 2: Cập nhật lại TIME LOGS cho khớp với Trạng Thái mới ---');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deletedLogs = await prisma.timeLog.deleteMany({
        where: { createdAt: { gte: today } }
    });
    console.log(`Đã làm sạch ${deletedLogs.count} dữ liệu Time logs rác của ngày hôm nay.`);

    const activities = await prisma.timeEntryActivity.findMany({ where: { isActive: true } });
    if (activities.length === 0) {
        throw new Error('Không có TimeEntryActivity nào trong hệ thống!');
    }

    const tasks = await prisma.task.findMany({
        include: {
            status: true,
            project: { include: { members: true } },
            timeLogs: true,
        }
    });

    let updatedTasksCount = 0;
    let createdLogsCount = 0;

    for (const task of tasks) {
        let est = task.estimatedHours;

        if (!est || est > 12) {
            est = Math.floor(Math.random() * 8) + 2; 
            await prisma.task.update({
                where: { id: task.id },
                data: { estimatedHours: est }
            });
            updatedTasksCount++;
        }

        if (task.timeLogs.length === 0 && est > 0) {
            let targetHours = 0;
            const r = Math.random();
            const isClosed = task.status?.isClosed;
            
            if (isClosed) {
                if (r < 0.3) targetHours = est + (Math.random() * 1.5 + 0.1); 
                else if (r < 0.6) targetHours = est - (Math.random() * 1.5 + 0.1); 
                else targetHours = est; 
            } else {
                if (r < 0.1) targetHours = 0; 
                else targetHours = est - (Math.random() * 2 + 0.5); 
            }

            if (targetHours > 0) {
                targetHours = Math.round(targetHours * 10) / 10;
                if (targetHours < 1) targetHours = 1;

                let userId = task.assigneeId;
                if (!userId && task.project.members.length > 0) {
                    const rndIdx = Math.floor(Math.random() * task.project.members.length);
                    userId = task.project.members[rndIdx].userId;
                }
                if (!userId) {
                    userId = task.creatorId;
                }

                let currentDate = new Date(task.updatedAt);
                if (currentDate.getTime() === task.createdAt.getTime()) {
                    currentDate.setHours(currentDate.getHours() + 4); 
                }

                const activity = activities[Math.floor(Math.random() * activities.length)];

                await prisma.timeLog.create({
                    data: {
                        hours: targetHours,
                        spentOn: currentDate,
                        userId: userId,
                        taskId: task.id,
                        projectId: task.projectId,
                        activityId: activity.id,
                        comments: "" 
                    }
                });
                createdLogsCount++;
            }
        }
    }

    console.log(`Đã đồng bộ hoá lại time logs cho ${createdLogsCount} công việc.`);
    console.log('\n--- HOÀN TẤT DEMO SEEDER ---');
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
