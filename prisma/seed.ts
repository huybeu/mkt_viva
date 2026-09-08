import "dotenv/config";
import { PrismaClient, PostStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.postImage.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
  const [an, binh] = await Promise.all([
    prisma.user.create({ data: { name: "Người A", email: "a@content.team" } }),
    prisma.user.create({ data: { name: "Người B", email: "b@content.team" } }),
  ]);
  await prisma.post.createMany({ data: [
    { title: "5 mẹo chuẩn bị eSIM trước chuyến đi", topicType: "Tour lẻ", content: "Một chuyến đi nhẹ nhàng bắt đầu từ việc chuẩn bị kết nối trước khi cất cánh.", scheduledAt: new Date("2026-09-09T02:00:00Z"), status: PostStatus.READY_TO_PUBLISH, assigneeId: an.id, notes: "Ưu tiên ảnh lifestyle" },
    { title: "Checklist du lịch mùa thu", topicType: "Tour lẻ", content: "Lưu ngay checklist nhỏ để hành lý gọn mà vẫn đủ.", scheduledAt: new Date("2026-09-11T02:00:00Z"), status: PostStatus.IN_PROGRESS, assigneeId: binh.id },
    { title: "Khách hàng nói gì về dịch vụ?", topicType: "Thương hiệu", content: "Cảm ơn những chia sẻ đáng yêu từ khách hàng.", scheduledAt: new Date("2026-09-14T02:00:00Z"), status: PostStatus.DRAFT, assigneeId: an.id },
    { title: "Ưu đãi data cuối tuần", topicType: "Khuyến mãi", content: "Đừng bỏ lỡ ưu đãi data dành riêng cho cuối tuần này.", scheduledAt: new Date("2026-09-06T02:00:00Z"), status: PostStatus.PUBLISHED, assigneeId: binh.id, publishedUrl: "https://facebook.com/" }
  ]});
}

main().finally(() => prisma.$disconnect());
