'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

// =============================================================================
// Phần 1: Định nghĩa kiểu dữ liệu (Types/Interfaces)
// =============================================================================
interface ActivityChartProps {
    data: { name: string; count: number }[];
}

// =============================================================================
// Phần 2: Component chính
// Component biểu đồ vùng (Area Chart) hiển thị tần suất hoạt động theo thời gian
// =============================================================================
export default function ActivityChart({ data }: ActivityChartProps) {
    return (
        <div className="h-[240px] w-full">
            {/* Sử dụng ResponsiveContainer để chart tự động co giãn theo thay đổi kích thước của container cha */}
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                    {/* Định nghĩa gradient màu cho vùng bên dưới đường biểu đồ (tạo cảm giác nổi và có chiều sâu hơn so với màu trơn) */}
                    <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    
                    {/* Lưới tọa độ ngang (ẩn lưới doc 'vertical=false' để giảm độ rối mắt cho người dùng) */}
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    
                    {/* Trục X: hiển thị chuỗi text (thường là nhãn thời gian: ngày/tháng) */}
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                        dy={10}
                    />
                    
                    {/* Trục Y: hiển thị số lượng (count) */}
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                    />
                    
                    {/* Tooltip khi người dùng hover vào các điểm trên biểu đồ, đã được custom lại shadow tĩnh để hiển thị đẹp hơn */}
                    <Tooltip
                        contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                    />
                    
                    {/* Đường biểu đồ (thuộc tính type="monotone" giúp đường cong rẽ ngoặt mềm mại thay vì gãy khúc gấp) */}
                    <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorCount)"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
