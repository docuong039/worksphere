'use client';

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';

// =============================================================================
// Phần 1: Định nghĩa kiểu dữ liệu & Hằng số
// Khai báo cấu trúc dữ liệu đầu vào và bảng màu mặc định cho các phần tử
// =============================================================================
interface DistributionChartProps {
    data: { name: string; count: number }[];
}

// Bảng màu tĩnh cho các mảng trong biểu đồ. Nếu số lượng data vượt quá số màu, mảng sẽ dùng lại màu (chia lấy dư modulo).
const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#6366f1', '#10b981', '#64748b'];

// =============================================================================
// Phần 2: Các hàm hỗ trợ (Helper functions)
// Xử lý logic hiển thị phần trăm (Label) ra bên ngoài biểu đồ Donut
// =============================================================================

/**
 * Render label mô tả cho từng nhánh trên biểu đồ Pie.
 * Thay vì để thư viện tự xếp, custom label giúp chỉnh lại tọa độ, canh lề nhằm tránh chữ đè sát lên biểu đồ.
 * @param {any} props Thuộc tính tính toán góc, tỉ lệ... của từng slice (x, y do Recharts truyền vào).
 */
const renderCustomizedLabel = (props: any) => {
    // x, y được Recharts tính sẵn dựa vào góc, khoảng cách từ tâm cx, cy.
    const { x, y, cx, percent } = props;
    
    // Bỏ qua giá trị rỗng/0 phần trăm để biểu đồ không bị rườm rà.
    if (!percent) return null; 

    return (
        <text
            x={x}
            y={y}
            fill="#475569"
            // Tự động đổi trục canh lề: 
            // Nếu tọa độ x nằm nửa phải (x > cx) thì canh bắt đầu từ trái ('start'), nếu nằm ở phía nửa trái thì canh phải ('end').
            textAnchor={x > cx ? 'start' : 'end'}
            dominantBaseline="central"
            style={{ fontSize: '11px', fontWeight: '600' }}
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

// =============================================================================
// Phần 3: Component Render Giao Diện
// =============================================================================
export default function DistributionChart({ data }: DistributionChartProps) {
    return (
        <div className="h-[300px] w-full">
            {/* Sử dụng ResponsiveContainer để chart tự động co giãn theo thay đổi kích thước của container cha */}
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    {/* Cấu hình xương sống biểu đồ Khuyên (Donut Chart):
                        - innerRadius: khoảng trống không màu ở tâm điểm
                        - paddingAngle: khoảng khe hở tẻ 2 mảng màu làm biểu đồ trông gãy gập tinh tế hơn */}
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        animationDuration={1500}
                        label={renderCustomizedLabel}
                        labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                    </Pie>
                    
                    {/* Xử lý hiển thị pop-up chi tiết (Tooltip) khi lướt chuột qua từng khối tròn.
                        Formatter được custom lại để nối thêm phần '%' cạnh giá trị gốc. */}
                    <Tooltip
                        formatter={(value: any, name: any, props: any) => {
                            const percent = props?.payload?.percent;
                            return percent
                                ? [`${value} (${(percent * 100).toFixed(0)}%)`, name] // Kết quả trả ra format: 'số lượng (x%)'
                                : [value, name];
                        }}
                        contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                    />
                    
                    {/* Chú giải bảng màu nằm ở dưới cùng */}
                    <Legend
                        iconType="circle"
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '20px' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

